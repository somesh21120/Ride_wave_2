/**
 * Server-to-client realtime events (Socket.IO).
 *
 * Rooms:
 *   user:<userId>   every socket of one logged-in user (joined via "user:join")
 *   drivers         all connected drivers (for new ride requests)
 *   admins          all connected admins (for live monitoring)
 *
 * Events emitted to clients:
 *   ride:updated    { ride, event }   whenever a ride changes (booked, accepted, started,
 *                                     completed, cancelled, pool matched)
 *   ride:new        { ride }          a new ride request drivers can accept
 *   ride:taken      { rideId, event } a request is no longer available to drivers
 *
 * Controllers call notifyRide(req, ride, event). If Socket.IO is not attached
 * (tests, scripts) the call is a no-op, so it is always safe to call.
 */

// In-memory driver location store (no database writes)
const driverLocations = new Map();

const setDriverLocation = (driverId, location) => {
  if (!driverId || !location || typeof location.lat !== "number" || typeof location.lng !== "number") return;
  driverLocations.set(String(driverId), { lat: location.lat, lng: location.lng, at: new Date() });
};

const getDriverLocation = (driverId) => {
  return driverLocations.get(String(driverId)) || null;
};

let ioRef = null;

const setIO = (io) => { ioRef = io; };
const getIO = () => ioRef;

const idOf = (v) => (v && v._id ? String(v._id) : v ? String(v) : null);

const notifyRide = (ride, event) => {
  if (!ioRef || !ride) return;
  const payload = { ride, event };
  const passengerId = idOf(ride.passenger);
  const driverId = idOf(ride.driver);
  if (passengerId) ioRef.to(`user:${passengerId}`).emit("ride:updated", payload);
  if (driverId) ioRef.to(`user:${driverId}`).emit("ride:updated", payload);
  (ride.coRiders || []).forEach((c) => {
    const id = idOf(c.user);
    if (id) ioRef.to(`user:${id}`).emit("ride:updated", payload);
  });
  ioRef.to("admins").emit("ride:updated", payload);

  // Drivers need to know when the list of open requests changes:
  // a request becomes visible (booked, or a pool closed / fell back to solo) ...
  const visibleToDrivers = ride.status === "requested" && ride.poolMatchStatus !== "waiting_for_match";
  if (visibleToDrivers && ["booked", "pool_matched", "pool_solo", "driver_cancelled"].includes(event)) {
    ioRef.to("drivers").emit("ride:new", { ride });
  }
  // ... or stops being available (taken by a driver, cancelled, absorbed into a pool).
  if (["accepted", "cancelled", "pool_absorbed"].includes(event)) {
    ioRef.to("drivers").emit("ride:taken", { rideId: String(ride._id), event });
  }
};

/** Emit a SOS alert to the admins room. */
const notifySos = (ride, byUserId) => {
  if (!ioRef || !ride) return;
  ioRef.to("admins").emit("ride:sos", {
    rideId: String(ride._id),
    at: ride.sosAt || new Date(),
    by: byUserId,
    status: ride.status,
    pickup: ride.pickupLocation?.address || "",
  });
};

module.exports = { setIO, getIO, notifyRide, notifySos, setDriverLocation, getDriverLocation };
