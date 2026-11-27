const express = require("express");
const router = express.Router();
const Ride = require("../models/Ride");
const { getDriverLocation } = require("../services/realtime");
const { isExpired } = require("../utils/shareToken");

// GET /api/public/trip/:token — no auth, read-only trip info
router.get("/trip/:token", async (req, res) => {
  try {
    const ride = await Ride.findOne({ shareToken: req.params.token })
      .select("+shareToken")
      .populate("driver", "name vehicle");
    if (!ride || isExpired(ride)) return res.status(404).json({ message: "This trip link has expired." });
    const driverLoc = ride.driver ? getDriverLocation(String(ride.driver._id)) : null;
    res.json({
      status: ride.status,
      rideType: ride.rideType,
      pickup: ride.pickupLocation,
      dropoff: ride.dropoffLocation,
      driver: ride.driver ? {
        firstName: ride.driver.name?.split(" ")[0] || "",
        vehicleModel: ride.driver.vehicle?.model || "",
        vehicleNumber: ride.driver.vehicle?.number || "",
      } : null,
      driverLocation: driverLoc,
      updatedAt: ride.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;