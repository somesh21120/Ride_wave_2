const express = require("express");
const router = express.Router();
const { createRecurring, getMyRecurring, updateRecurring, deleteRecurring } = require("../controllers/recurringRideController");
const { protect } = require("../middleware/authMiddleware");
router.post("/", protect, createRecurring);
router.get("/my", protect, getMyRecurring);
router.put("/:id", protect, updateRecurring);
router.delete("/:id", protect, deleteRecurring);
module.exports = router;
