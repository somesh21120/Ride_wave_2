const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
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
  getMatchLogs,
} = require("../controllers/adminController");

router.use(protect, admin);

router.get("/stats", getStats);
router.get("/analytics", getAnalytics);
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/rides", getRides);
router.get("/rides/:id", getRideDetail);
router.put("/rides/:id", updateRideStatus);
router.delete("/rides/:id", deleteRide);
router.get("/recurring", getRecurringRides);
router.get("/match-logs", getMatchLogs);

module.exports = router;
