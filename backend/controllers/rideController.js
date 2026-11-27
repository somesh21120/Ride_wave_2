const crypto = require("crypto");
const Ride = require("../models/Ride");
const User = require("../models/User");
const { calcFare } = require("../services/poolMatchService");
const { assertTransition } = require("../utils/rideStateMachine");
const { notifyRide, notifySos, setDriverLocation, getDriverLocation } = require("../services/realtime");
const { newToken, isExpired } = require("../utils/shareToken");

// Label collected AI training data with how the pooled ride ended (never blocks the request)
const labelMatchLogs = (rideId, outcome) => {
  try {
    require("../models/MatchLog").updateMany({ ride: rideId }, { $set: { outcome } }).catch(() => {});
  } catch { /* logging is best effort */ }
};

// 4-digit ride start code, shown only to the passenger (Ride.startOtp is select:false)
const newStartOtp = () => String(crypto.randomInt(1000, 10000));

// Send a controller error with the right status (state-machine errors carry status 400)
const fail = (res, error) => res.status(error.status || 500).json({ message: error.message });

const MAX_RIDE_DIST_KM = 50;
// India bounding box
const INDIA_BOUNDS = { latMin: 6.5, latMax: 35.5, lngMin: 68.0, lngMax: 97.5 };
const isInIndia = (loc) => loc && typeof loc.lat === "number" && typeof loc.lng === "number" && loc.lat >= INDIA_BOUNDS.latMin && loc.lat <= INDIA_BOUNDS.latMax && loc.lng >= INDIA_BOUNDS.lngMin && loc.lng <= INDIA_BOUNDS.lngMax;
// Only multi-seat vehicles can be pooled (a bike carries one passenger)
const POOLABLE = ["car", "auto"];

const bookRide = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, rideType, paymentMethod, distance, rideCategory, poolType, seatsTotal, instantPool } = req.body;
    const isPool = rideCategory === "pool";
    if ((isPool || instantPool === true) && !POOLABLE.includes(rideType)) return res.status(400).json({ message: "Pooling is available for cars and autos only" });
    const isInstantPool = instantPool === true && (rideType === "car" || rideType === "auto");
    if (typeof distance !== "number" || isNaN(distance)) return res.status(400).json({ message: "Invalid ride distance" });
    if (distance > MAX_RIDE_DIST_KM) return res.status(400).json({ message: "This route is too long for RideWave - try a shorter trip" });
    if (!isInIndia(pickupLocation)) return res.status(400).json({ message: "Pickup location must be in India" });
    if (!isInIndia(dropoffLocation)) return res.status(400).json({ message: "Dropoff location must be in India" });
    if (isInstantPool) {
      const poolFare = calcFare(distance, rideType, true);
      const fullFare = calcFare(distance, rideType, false);
      const maxPax = rideType === "auto" ? 3 : 3;
      const ride = await Ride.create({ passenger: req.user._id, pickupLocation, dropoffLocation, rideType, paymentMethod, distance, fare: poolFare, rideCategory: "pool", poolType: "carpool", seatsTotal: 1, seatsAvailable: 0, poolMatchStatus: "waiting_for_match", poolMatchRequestedAt: new Date(), poolSavings: fullFare - poolFare, poolMaxPassengers: maxPax });
      notifyRide(ride, "booked");
      return res.status(201).json(ride);
    }
    const fare = calcFare(distance, rideType, isPool);
    const ride = await Ride.create({ passenger: req.user._id, pickupLocation, dropoffLocation, rideType, paymentMethod, distance, fare, rideCategory: isPool ? "pool" : "standard", poolType: isPool ? (poolType || "carpool") : null, seatsTotal: isPool ? Math.max(2, Math.min(4, Number(seatsTotal) || 2)) : 1, seatsAvailable: isPool ? Math.max(1, Math.min(3, (Number(seatsTotal) || 2) - 1)) : 0 });
    notifyRide(ride, "booked");
    res.status(201).json(ride);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getMyRides = async (req, res) => {
  try {
    const myId = req.user._id;
    const rides = await Ride.find({ passenger: myId }).select("+startOtp").populate("driver", "name phone vehicle").populate("coRiders.user", "name phone").populate("poolMatchedRide", "pickupLocation dropoffLocation distance fare driver status").sort({ createdAt: -1 });
    // Also include the spine ride if the user is a co-rider in an active pool
    const coRiderRides = await Ride.find({
      "coRiders.user": myId,
      status: { $in: ["accepted", "ongoing"] },
    }).select("+coRiders.otp").populate("passenger", "name phone").populate("driver", "name phone vehicle").populate("coRiders.user", "name phone").sort({ createdAt: -1 });
    // Mark co-rider rides and add their OTP
    const allRides = [...rides];
    for (const spine of coRiderRides) {
      const myEntry = spine.coRiders.find((c) => String(c.user?._id || c.user) === String(myId));
      const spineObj = spine.toObject();
      spineObj.myOtp = myEntry?.otp || null;
      spineObj.isCoRider = true;
      allRides.push(spineObj);
    }
    res.json(allRides);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate("passenger", "name phone").populate("driver", "name phone vehicle").populate("coRiders.user", "name phone");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    const me = String(req.user._id);
    const involved = String(ride.passenger?._id) === me || String(ride.driver?._id) === me ||
      ride.coRiders.some((c) => String(c.user?._id || c.user) === me);
    // Drivers may view open requests they could accept
    const openForDriver = req.user.role === "driver" && ride.status === "requested";
    if (!involved && !openForDriver && req.user.role !== "admin") return res.status(403).json({ message: "Not your ride" });
    if (String(ride.passenger?._id) === me) {
      const withOtp = await Ride.findById(ride._id).select("+startOtp").lean();
      return res.json({ ...ride.toObject(), startOtp: withOtp?.startOtp || null });
    }
    // Driver: expose co-rider OTPs for multi-stop pickup
    if (String(ride.driver?._id) === me) {
      const withCoOtps = await Ride.findById(ride._id).populate("passenger", "name phone").populate("driver", "name phone vehicle").populate("coRiders.user", "name phone").select("+coRiders.otp").lean();
      return res.json(withCoOtps);
    }
    // Co-rider: show their own OTP
    const myCo = ride.coRiders.find((c) => String(c.user?._id || c.user) === me);
    if (myCo) {
      const withOtp = await Ride.findById(ride._id).select("+coRiders.otp").lean();
      const myEntry = withOtp.coRiders.find((c) => String(c.user) === me);
      return res.json({ ...ride.toObject(), myOtp: myEntry?.otp || null });
    }
    res.json(ride);
  } catch (error) { fail(res, error); }
};

const cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    const isPassenger = String(ride.passenger) === String(req.user._id);
    const isDriver = ride.driver && String(ride.driver) === String(req.user._id);
    if (!isPassenger && !isDriver) return res.status(403).json({ message: "Only the passenger or assigned driver can cancel this ride" });
    // Driver backs out of an accepted ride: put it back in the queue for another
    // driver instead of cancelling the passenger's trip (like Ola/Uber reassign).
    if (isDriver && !isPassenger && ride.status === "accepted") {
      ride.status = "requested";
      ride.driver = null;
      ride.acceptedAt = null;
      ride.startOtp = null; // a new code is created when the next driver accepts
      if (!ride.rejectedBy.some((id) => String(id) === String(req.user._id))) ride.rejectedBy.push(req.user._id);
      await ride.save();
      notifyRide(ride, "driver_cancelled");
      return res.json({ ...ride.toObject(), message: "Ride released. The passenger will be matched with another driver." });
    }
    assertTransition(ride.status, "cancelled");
    ride.status = "cancelled";
    ride.cancelledBy = isDriver ? "driver" : "passenger";
    await ride.save();
    if (ride.poolMatchStatus === "matched") labelMatchLogs(ride._id, "cancelled");
    notifyRide(ride, "cancelled");
    res.json(ride);
  } catch (error) { fail(res, error); }
};

const getAvailableRides = async (req, res) => {
  try {
    const driver = await User.findById(req.user._id);
    const vehicleType = driver?.vehicle?.type;
    const rideTypeFilter = vehicleType ? { rideType: vehicleType } : {};
    // Show all requested rides to drivers, including those waiting for a pool match.
    // If a driver accepts while the pool matcher is still evaluating, the ride transitions
    // to "accepted" and the pool match is cancelled (the matcher only touches "requested" rides).
    const rides = await Ride.find({ status: "requested", rejectedBy: { $ne: req.user._id }, ...rideTypeFilter }).populate("passenger", "name phone").sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const acceptRide = async (req, res) => {
  try {
    if (req.user.role !== "driver") return res.status(403).json({ message: "Only drivers can accept rides" });
    const busy = await Ride.exists({ driver: req.user._id, status: { $in: ["accepted", "ongoing"] } });
    if (busy) return res.status(400).json({ message: "Finish your current ride before accepting another" });
    // Atomic claim: only one driver can move a ride out of "requested",
    // even if two drivers tap Accept at the same moment.
    // Also accept rides that are waiting for a pool match — the driver takes priority.
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, status: "requested" },
      { $set: { driver: req.user._id, status: "accepted", acceptedAt: new Date(), startOtp: newStartOtp(), poolMatchStatus: "reverted_to_solo", rideCategory: "standard", poolSavings: 0 } },
      { new: true }
    ).populate("driver", "name phone vehicle").populate("passenger", "name phone");
    if (!ride) {
      const exists = await Ride.exists({ _id: req.params.id });
      return res.status(exists ? 409 : 404).json({ message: exists ? "Ride no longer available" : "Ride not found" });
    }
    notifyRide(ride, "accepted");
    res.json(ride);
  } catch (error) { fail(res, error); }
};

const rejectRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.status !== "requested") return res.status(400).json({ message: "Ride is no longer available" });
    if (!ride.rejectedBy.includes(req.user._id)) { ride.rejectedBy.push(req.user._id); await ride.save(); }
    res.json({ message: "Ride rejected" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const startRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).select("+startOtp");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (String(ride.driver) !== String(req.user._id)) return res.status(403).json({ message: "Only the assigned driver can start this ride" });
    assertTransition(ride.status, "ongoing");
    // OTP check: the passenger tells the driver the 4-digit code shown in their app.
    // Rides accepted before OTP existed have no code and can start without one.
    if (ride.startOtp) {
      const given = String(req.body?.otp ?? "").trim();
      if (!given) return res.status(400).json({ message: "Enter the 4-digit ride code from the passenger" });
      if (given !== ride.startOtp) return res.status(400).json({ message: "Incorrect ride code. Ask the passenger to check their app." });
    }
    ride.status = "ongoing";
    ride.startedAt = new Date();
    ride.startOtp = null;
    // Mark the main passenger as picked up
    if (ride.rideCategory === "pool" && ride.coRiders.length > 0) {
      const mainCo = ride.coRiders.find((c) => c.status === "joined");
      if (mainCo) { mainCo.status = "picked_up"; mainCo.pickedUpAt = new Date(); }
    }
    await ride.save();
    notifyRide(ride, "started");
    res.json(ride);
  } catch (error) { fail(res, error); }
};

const completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (!ride.driver || String(ride.driver) !== String(req.user._id)) return res.status(403).json({ message: "Only the assigned driver can complete this ride" });
    assertTransition(ride.status, "completed");
    ride.status = "completed";
    ride.paymentStatus = "paid";
    ride.completedAt = new Date();
    await ride.save();
    notifyRide(ride, "completed");
    if (ride.poolMatchStatus === "matched") labelMatchLogs(ride._id, "completed");
    res.json(ride);
  } catch (error) { fail(res, error); }
};

const getOpenPools = async (req, res) => {
  try {
    const pools = await Ride.find({ rideCategory: "pool", rideType: { $in: POOLABLE }, status: "requested", seatsAvailable: { $gt: 0 }, passenger: { $ne: req.user._id }, "coRiders.user": { $ne: req.user._id } }).populate("passenger", "name").sort({ createdAt: -1 });
    res.json(pools);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const joinPool = async (req, res) => {
  try {
    const { pickupLocation, distance } = req.body;
    if (!pickupLocation || typeof distance !== "number") return res.status(400).json({ message: "Pickup location and distance are required" });
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.rideCategory !== "pool" || ride.status !== "requested") return res.status(400).json({ message: "This ride is not an open pool" });
    if (!POOLABLE.includes(ride.rideType)) return res.status(400).json({ message: "Pooling is available for cars and autos only" });
    if (ride.seatsAvailable <= 0) return res.status(400).json({ message: "No seats available" });
    if (String(ride.passenger) === String(req.user._id)) return res.status(400).json({ message: "You created this pool" });
    if (ride.coRiders.some(c => String(c.user) === String(req.user._id) && c.status === "joined")) return res.status(400).json({ message: "You already joined this pool" });
    const fare = calcFare(distance, ride.rideType, true);
    ride.coRiders.push({ user: req.user._id, pickupLocation, fare });
    ride.seatsAvailable -= 1;
    await ride.save();
    res.json(ride);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const leavePool = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    const entry = ride.coRiders.find(c => String(c.user) === String(req.user._id) && c.status === "joined");
    if (!entry) return res.status(400).json({ message: "You are not part of this pool" });
    entry.status = "cancelled";
    ride.seatsAvailable += 1;
    await ride.save();
    res.json(ride);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getDriverRides = async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user._id }).populate("passenger", "name phone").populate("coRiders.user", "name phone").sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getPoolMatchStatus = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate("poolMatchedRide", "pickupLocation dropoffLocation distance fare driver poolMatchStatus").populate("driver", "name phone");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (String(ride.passenger) !== String(req.user._id)) return res.status(403).json({ message: "Not your ride" });
    res.json({ _id: ride._id, poolMatchStatus: ride.poolMatchStatus, fare: ride.fare, poolSavings: ride.poolSavings, poolMatchedRide: ride.poolMatchedRide, poolMaxPassengers: ride.poolMaxPassengers, poolMatcher: ride.poolMatcher, poolMatchNote: ride.poolMatchNote, driver: ride.driver, status: ride.status });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ---- Share trip ----
const shareRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).select("+shareToken");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (String(ride.passenger) !== String(req.user._id) && !ride.coRiders.some(c => String(c.user) === String(req.user._id)))
      return res.status(403).json({ message: "Only the passenger or a co-rider can share this ride" });
    if (ride.status !== "accepted" && ride.status !== "ongoing")
      return res.status(400).json({ message: "Ride must be accepted or ongoing to share" });
    if (!ride.shareToken || isExpired(ride)) {
      ride.shareToken = newToken();
      ride.shareExpiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    } else {
      // Refresh expiry but keep the same token
      ride.shareExpiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    }
    await ride.save();
    res.json({ token: ride.shareToken });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ---- SOS alert ----
const sosRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    const isRider = String(ride.passenger) === String(req.user._id) || ride.coRiders.some(c => String(c.user) === String(req.user._id));
    const isDriver = String(ride.driver) === String(req.user._id);
    if (!isRider && !isDriver) return res.status(403).json({ message: "Not your ride" });
    if (ride.status !== "accepted" && ride.status !== "ongoing")
      return res.status(400).json({ message: "Ride must be active to send an SOS" });
    ride.sosAt = new Date();
    ride.sosBy = req.user._id;
    await ride.save();
    notifySos(ride, req.user._id);
    res.json({ ok: true });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ---- Skip pool match — revert to solo immediately so the ride is visible to drivers ----
const skipPool = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (String(ride.passenger) !== String(req.user._id)) return res.status(403).json({ message: "Only the passenger can skip pool" });
    if (ride.poolMatchStatus !== "waiting_for_match") return res.status(400).json({ message: "Ride is not waiting for a pool match" });
    const fullFare = calcFare(ride.distance, ride.rideType, false);
    ride.fare = fullFare;
    ride.poolSavings = 0;
    ride.poolMatchStatus = "reverted_to_solo";
    ride.rideCategory = "standard";
    await ride.save();
    notifyRide(ride, "pool_solo");
    res.json(ride);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ---- Driver picks up a co-rider (multi-stop corridor pool) ----
const pickupCoRider = async (req, res) => {
  try {
    const { coRiderUserId, otp } = req.body;
    if (!coRiderUserId || !otp) return res.status(400).json({ message: "coRiderUserId and otp are required" });
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (String(ride.driver) !== String(req.user._id)) return res.status(403).json({ message: "Only the driver can confirm pickup" });
    if (ride.status !== "ongoing") return res.status(400).json({ message: "Ride must be ongoing" });
    const coIdx = ride.coRiders.findIndex((c) => String(c.user) === String(coRiderUserId));
    if (coIdx === -1) return res.status(404).json({ message: "Co-rider not found in this ride" });
    const co = ride.coRiders[coIdx];
    if (co.status === "picked_up") return res.status(400).json({ message: "Co-rider already picked up" });
    if (co.status === "cancelled") return res.status(400).json({ message: "Co-rider cancelled" });
    if (String(otp).trim() !== String(co.otp)) return res.status(400).json({ message: "Incorrect OTP for this co-rider" });
    co.status = "picked_up";
    co.pickedUpAt = new Date();
    co.otp = null;
    await ride.save();
    notifyRide(ride, "corider_picked_up");
    res.json(ride);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { bookRide, getMyRides, getRideById, cancelRide, getAvailableRides, acceptRide, rejectRide, startRide, completeRide, getOpenPools, joinPool, leavePool, getDriverRides, getPoolMatchStatus, skipPool, pickupCoRider, shareRide, sosRide };
