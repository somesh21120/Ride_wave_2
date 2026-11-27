const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pickupLocation: { address: String, lat: Number, lng: Number },
  dropoffLocation: { address: String, lat: Number, lng: Number },
  rideType: { type: String, enum: ["bike", "auto", "car"], default: "car" },
  paymentMethod: { type: String, enum: ["cash", "online"], default: "cash" },
  time: { type: String, required: true }, // "HH:MM" 24h
  daysOfWeek: { type: [Number], required: true }, // 0=Sun..6=Sat
  active: { type: Boolean, default: true },
  lastGeneratedDate: { type: String, default: null }, // "YYYY-MM-DD"
}, { timestamps: true });
module.exports = mongoose.model("RecurringRide", schema);
