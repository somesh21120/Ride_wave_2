const User = require("../models/User");
const Ride = require("../models/Ride");
const RecurringRide = require("../models/RecurringRide");
const { notifyRide } = require("../services/realtime");
const { fillDays } = require("../utils/analytics");

const DEFAULT_SEATS = { bike: 2, auto: 4, car: 5 };

// ---- Create user (admin adds a driver, passenger or another admin) ----
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role = "driver", vehicleType, vehicleModel, vehicleNumber, carSubtype, seatingCapacity } = req.body;
    if (!name || !email || !password || !phone) return res.status(400).json({ message: "Name, email, password and phone are required" });
    if (String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!["passenger", "driver", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (await User.findOne({ email: String(email).toLowerCase().trim() })) return res.status(400).json({ message: "A user with this email already exists" });
    const data = { name, email: String(email).toLowerCase().trim(), password, phone, role, isVerified: true };
    if (role === "driver") {
      if (!vehicleType || !vehicleNumber) return res.status(400).json({ message: "Drivers need a vehicle type and number" });
      data.vehicle = {
        type: vehicleType,
        model: vehicleModel || "",
        number: String(vehicleNumber).toUpperCase(),
        carSubtype: vehicleType === "car" ? (carSubtype || "") : "",
        seatingCapacity: Number(seatingCapacity) || DEFAULT_SEATS[vehicleType] || 2,
      };
    }
    const user = await User.create(data);
    const out = user.toObject();
    delete out.password;
    res.status(201).json(out);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- Single ride with everyone involved (admin ride detail view) ----
const getRideDetail = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("passenger", "name email phone")
      .populate("driver", "name email phone vehicle")
      .populate("coRiders.user", "name phone");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- Overview stats ----
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalRides, completedRides, requestedRides, totalRecurring, openPools, drivers, passengers, activeRides, cancelledRides, pooledRides] = await Promise.all([
      User.countDocuments(),
      Ride.countDocuments(),
      Ride.countDocuments({ status: "completed" }),
      Ride.countDocuments({ status: "requested" }),
      RecurringRide.countDocuments(),
      Ride.countDocuments({ rideCategory: "pool", status: "requested" }),
      User.countDocuments({ role: "driver" }),
      User.countDocuments({ role: "passenger" }),
      Ride.countDocuments({ status: { $in: ["accepted", "ongoing"] } }),
      Ride.countDocuments({ status: "cancelled" }),
      Ride.countDocuments({ poolMatchStatus: "matched" }),
    ]);
    const savings = await Ride.aggregate([
      { $match: { poolMatchStatus: "matched" } },
      { $group: { _id: null, sum: { $sum: "$poolSavings" } } },
    ]);

    const totalRevenue = await Ride.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, sum: { $sum: "$fare" } } },
    ]);

    const recentRides = await Ride.find()
      .populate("passenger", "name email")
      .populate("driver", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      counts: {
        users: totalUsers,
        rides: totalRides,
        completedRides,
        requestedRides,
        recurringRides: totalRecurring,
        openPools,
        drivers,
        passengers,
        activeRides,
        cancelledRides,
        pooledRides,
      },
      poolSavings: savings.length ? savings[0].sum : 0,
      revenue: totalRevenue.length ? totalRevenue[0].sum : 0,
      recentRides,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- Users management ----
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { role, isActive, name, phone, vehicleType, vehicleModel, vehicleNumber, carSubtype, seatingCapacity, isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (role && ["passenger", "driver", "admin"].includes(role)) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (vehicleType) user.vehicle.type = vehicleType;
    if (vehicleModel) user.vehicle.model = vehicleModel;
    if (vehicleNumber) user.vehicle.number = vehicleNumber;
    if (carSubtype) user.vehicle.carSubtype = carSubtype;
    if (typeof seatingCapacity === "number") user.vehicle.seatingCapacity = seatingCapacity;
    if (typeof isVerified === "boolean") user.isVerified = isVerified;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- Rides management ----
const getRides = async (req, res) => {
  try {
    const { status, sos } = req.query;
    const filter = {};
    if (status) filter.status = status;
    // ?sos=1 -> rides with an SOS alert in the last 24 hours, newest alert first
    if (sos === "1") filter.sosAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    const rides = await Ride.find(filter)
      .populate("passenger", "name email phone")
      .populate("driver", "name phone")
      .populate("sosBy", "name role")
      .sort(sos === "1" ? { sosAt: -1 } : { createdAt: -1 })
      .limit(200);
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["requested", "accepted", "ongoing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    // Admin override: any status is allowed on purpose (fixing stuck rides during demos),
    // unlike drivers/passengers who must follow utils/rideStateMachine.js.
    ride.status = status;
    if (status === "completed") { ride.paymentStatus = "paid"; ride.completedAt = ride.completedAt || new Date(); }
    if (status === "cancelled") ride.cancelledBy = "admin";
    await ride.save();
    notifyRide(ride, status === "cancelled" ? "cancelled" : "admin_updated");
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    res.json({ message: "Ride deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- Recurring rides management ----
const getRecurringRides = async (req, res) => {
  try {
    const rides = await RecurringRide.find()
      .populate("passenger", "name email")
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- Analytics ----
const getAnalytics = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 1), 90);
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const [dailyRaw, byType, byStatus, poolStats, matcherStats] = await Promise.all([
      Ride.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
            rides: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            pooled: { $sum: { $cond: [{ $eq: ["$rideCategory", "pool"] }, 1, 0] } },
            revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$fare", 0] } },
          }
        },
        { $sort: { _id: 1 } },
      ]),
      Ride.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: "$rideType", count: { $sum: 1 } } },
      ]),
      Ride.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Ride.aggregate([
        { $match: { createdAt: { $gte: start }, rideCategory: "pool" } },
        { $group: {
            _id: null,
            pooledRides: { $sum: 1 },
            totalSavings: { $sum: { $ifNull: ["$poolSavings", 0] } },
          }
        },
      ]),
      Ride.aggregate([
        { $match: { createdAt: { $gte: start }, rideCategory: "pool", poolMatcher: { $ne: null } } },
        { $group: { _id: "$poolMatcher", count: { $sum: 1 } } },
      ]),
    ]);

    const daily = fillDays(dailyRaw.map(r => ({ date: r._id, rides: r.rides, completed: r.completed, pooled: r.pooled, revenue: r.revenue })), days, now);

    const byTypeObj = { bike: 0, auto: 0, car: 0 };
    byType.forEach(r => { if (byTypeObj[r._id] !== undefined) byTypeObj[r._id] = r.count; });

    const byStatusObj = { requested: 0, accepted: 0, ongoing: 0, completed: 0, cancelled: 0 };
    byStatus.forEach(r => { if (byStatusObj[r._id] !== undefined) byStatusObj[r._id] = r.count; });

    const matchersObj = { proximity: 0, corridor: 0, smart: 0 };
    matcherStats.forEach(r => { if (matchersObj[r._id] !== undefined) matchersObj[r._id] = r.count; });

    res.json({
      days,
      daily,
      byType: byTypeObj,
      byStatus: byStatusObj,
      pool: {
        pooledRides: poolStats[0]?.pooledRides || 0,
        totalSavings: Math.round(poolStats[0]?.totalSavings || 0),
        matchers: matchersObj,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getRideDetail,
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getRides,
  updateRideStatus,
  deleteRide,
  getRecurringRides,
  getAnalytics,
};
