const Review = require("../models/Review");
const Ride = require("../models/Ride");
const User = require("../models/User");

// Create a review. Determines reviewee based on the reviewer's role:
// - passenger reviews the ride's driver
// - driver reviews the ride's passenger
// - admin can review the driver of a ride
const createReview = async (req, res) => {
  try {
    const { rideId, rating, comment } = req.body;
    if (!rideId || !rating) return res.status(400).json({ message: "Ride and rating are required" });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const reviewer = req.user;
    let revieweeId;

    if (reviewer.role === "passenger") {
      if (!ride.driver) return res.status(400).json({ message: "This ride has no driver to review" });
      if (String(ride.passenger) !== String(reviewer._id)) return res.status(403).json({ message: "You can only review rides you took" });
      revieweeId = ride.driver;
    } else if (reviewer.role === "driver") {
      if (String(ride.driver) !== String(reviewer._id)) return res.status(403).json({ message: "You can only review your own rides" });
      revieweeId = ride.passenger;
    } else if (reviewer.role === "admin") {
      if (!ride.driver) return res.status(400).json({ message: "This ride has no driver to review" });
      revieweeId = ride.driver;
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    const review = await Review.create({
      ride: rideId,
      reviewer: reviewer._id,
      reviewerRole: reviewer.role,
      reviewee: revieweeId,
      rating,
      comment: comment || "",
    });

    res.status(201).json(review);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Reviews a user has RECEIVED (e.g. reviews about a driver, written by passengers).
const getReceivedReviews = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    if (req.user.role !== "admin" && String(req.user._id) !== String(userId)) {
      return res.status(403).json({ message: "You can only view your own reviews" });
    }
    const reviews = await Review.find({ reviewee: userId })
      .populate("reviewer", "name role")
      .populate("ride", "rideType fare")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Reviews a user has WRITTEN.
const getWrittenReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate("reviewee", "name role")
      .populate("ride", "rideType fare")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Admin: list all reviews.
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("reviewer", "name role")
      .populate("reviewee", "name role")
      .populate("ride", "rideType fare")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Admin: delete a review.
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { createReview, getReceivedReviews, getWrittenReviews, getAllReviews, deleteReview };
