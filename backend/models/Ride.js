const mongoose = require("mongoose");

const coRiderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pickupLocation: { address: String, lat: Number, lng: Number },
  dropoffLocation: { address: String, lat: Number, lng: Number }, // v2 corridor pools
  fare: { type: Number, required: true },
  sharedKm: { type: Number, default: null },  // v2: km shared with the main route
  detourKm: { type: Number, default: null },  // v2: extra km driven for this rider
  status: { type: String, enum: ["joined", "picked_up", "cancelled"], default: "joined" },
  otp: { type: String, default: null, select: false },
  pickedUpAt: { type: Date, default: null },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const rideSchema = new mongoose.Schema(
  {
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    pickupLocation: { address: { type: String, required: true }, lat: { type: Number, required: true }, lng: { type: Number, required: true } },
    dropoffLocation: { address: { type: String, required: true }, lat: { type: Number, required: true }, lng: { type: Number, required: true } },
    fare: { type: Number, required: true },
    distance: { type: Number, required: true },
    status: { type: String, enum: ["requested", "accepted", "ongoing", "completed", "cancelled"], default: "requested" },
    paymentMethod: { type: String, enum: ["cash", "online"], default: "cash" },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    rideType: { type: String, enum: ["bike", "auto", "car"], default: "car" },
    // Pool fields
    rideCategory: { type: String, enum: ["standard", "pool"], default: "standard" },
    poolType: { type: String, enum: ["carpool", "bikepool", null], default: null },
    seatsTotal: { type: Number, default: 1 },
    seatsAvailable: { type: Number, default: 0 },
    coRiders: { type: [coRiderSchema], default: [] },
    // Instant pool-match fields
    poolMatchStatus: { type: String, enum: ["solo", "waiting_for_match", "matched", "reverted_to_solo"], default: "solo" },
    poolMatchedRide: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", default: null },
    poolSavings: { type: Number, default: 0 },
    poolMatchRequestedAt: { type: Date, default: null },
    poolMaxPassengers: { type: Number, default: 2 }, // max riders in this pool (not counting driver)
    // v2: which matcher formed the pool and a one-line reason shown to the rider
    poolMatcher: { type: String, enum: ["proximity", "corridor", "smart", null], default: null },
    poolMatchNote: { type: String, default: null },
    // v2: 4-digit code the passenger gives the driver to start the ride (hidden by default)
    startOtp: { type: String, default: null, select: false },
    // Daily/recurring link
    recurringRideId: { type: mongoose.Schema.Types.ObjectId, ref: "RecurringRide", default: null },
    // Drivers who rejected this ride (so they don't see it again)
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Lifecycle timestamps (v2): used for analytics and the ride timeline
    acceptedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ["passenger", "driver", "admin", "system", null], default: null },
    // Safety: share-trip link and SOS
    shareToken: { type: String, default: null, index: true, select: false },
    shareExpiresAt: { type: Date, default: null },
    sosAt: { type: Date, default: null },
    sosBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Indexes for the queries the app runs most (driver feed, my rides, pool matcher)
rideSchema.index({ status: 1, rideType: 1, createdAt: -1 });
rideSchema.index({ passenger: 1, createdAt: -1 });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ poolMatchStatus: 1, poolMatchRequestedAt: 1 });

module.exports = mongoose.model("Ride", rideSchema);
