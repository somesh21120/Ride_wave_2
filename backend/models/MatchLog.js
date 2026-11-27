const mongoose = require("mongoose");

/**
 * Data collection for the AI pairing model (real app data).
 * One document per candidate the corridor / smart matcher evaluated for a pool:
 * the features, the model's prediction (if any), whether it was chosen, and later the
 * outcome of the pooled ride (completed / cancelled). This is the dataset the pairing
 * model can be retrained on once real usage exists (scripts/train-pairing-model.js
 * currently trains on simulated data).
 */
const matchLogSchema = new mongoose.Schema(
  {
    ride: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },      // corridor (spine) ride
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true }, // evaluated ride
    matcher: { type: String, enum: ["corridor", "smart"], required: true },
    features: {
      pickupOffKm: Number, dropOffKm: Number, overlapRatio: Number, detourKm: Number,
      savingPct: Number, waitMin: Number, directKm: Number,
    },
    eligible: { type: Boolean, default: false },
    reason: { type: String, default: null },     // why it was rejected, if it was
    predicted: { type: Number, default: null },  // model's acceptance probability (smart)
    chosen: { type: Boolean, default: false },
    outcome: { type: String, enum: ["completed", "cancelled", null], default: null },
  },
  { timestamps: true }
);
matchLogSchema.index({ ride: 1 });
matchLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("MatchLog", matchLogSchema);
