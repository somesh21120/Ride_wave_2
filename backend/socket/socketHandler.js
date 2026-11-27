/**
 * Socket.IO connection handling.
 *
 * Client -> server events:
 *   user:join        { userId, role }        join personal room (+ "drivers"/"admins")
 *   driver:online    { driverId, location }  driver available on the map
 *   driver:location  { driverId, location }  live position while online / on a ride
 *   driver:offline   { driverId }
 *
 * Server -> client events:
 *   drivers:updated        [ { driverId, location } ]
 *   driver:locationUpdate  { driverId, location }
 *   ride:updated / ride:new / ride:taken   (see services/realtime.js)
 *
 * The old client-emitted ride:request / ride:accept / ride:complete / ride:cancel
 * relays are kept for backward compatibility, but the source of truth is now the
 * server: controllers emit ride events after the database is updated.
 */
const { setIO, setDriverLocation } = require("../services/realtime");

const socketHandler = (io) => {
  setIO(io);
  const activeDrivers = {};

  io.on("connection", (socket) => {
    socket.on("user:join", ({ userId, role } = {}) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      if (role === "driver") socket.join("drivers");
      if (role === "admin") socket.join("admins");
      socket.data.userId = String(userId);
    });

    socket.on("driver:online", ({ driverId, location } = {}) => {
      if (!driverId) return;
      activeDrivers[driverId] = { socketId: socket.id, location, driverId };
      io.emit("drivers:updated", Object.values(activeDrivers));
    });

    socket.on("driver:location", ({ driverId, location } = {}) => {
      if (!driverId) return;
      if (!activeDrivers[driverId]) activeDrivers[driverId] = { socketId: socket.id, driverId };
      activeDrivers[driverId].location = location;
      setDriverLocation(driverId, location);
      io.emit("driver:locationUpdate", { driverId, location });
    });

    socket.on("driver:offline", ({ driverId } = {}) => {
      delete activeDrivers[driverId];
      io.emit("drivers:updated", Object.values(activeDrivers));
    });

    // Legacy relays (v1 clients)
    socket.on("ride:request", (rideData) => io.emit("ride:newRequest", rideData));
    socket.on("ride:accept", (d) => io.emit("ride:accepted", d));
    socket.on("ride:complete", (d) => io.emit("ride:completed", d));
    socket.on("ride:cancel", (d) => io.emit("ride:cancelled", d));

    socket.on("disconnect", () => {
      for (const driverId in activeDrivers) {
        if (activeDrivers[driverId].socketId === socket.id) {
          delete activeDrivers[driverId];
          io.emit("drivers:updated", Object.values(activeDrivers));
          break;
        }
      }
    });
  });
};

module.exports = socketHandler;
