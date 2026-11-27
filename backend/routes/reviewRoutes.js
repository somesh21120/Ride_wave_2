const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const { createReview, getReceivedReviews, getWrittenReviews, getAllReviews, deleteReview } = require("../controllers/reviewController");

router.post("/", protect, createReview);
router.get("/received/:userId", protect, getReceivedReviews);
router.get("/written", protect, getWrittenReviews);
router.get("/all", protect, admin, getAllReviews);
router.delete("/:id", protect, admin, deleteReview);

module.exports = router;
