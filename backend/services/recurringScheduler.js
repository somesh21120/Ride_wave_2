const cron = require("node-cron");
const RecurringRide = require("../models/RecurringRide");
const Ride = require("../models/Ride");
const { notifyRide } = require("./realtime");

const RIDE_RATES = { bike: { base: 20, per: 8 }, auto: { base: 30, per: 12 }, car: { base: 50, per: 18 } };
const getDistance = (p, d) => {
  const dLat = ((d.lat - p.lat) * Math.PI) / 180, dLon = ((d.lng - p.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((p.lat * Math.PI) / 180) * Math.cos((d.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

const generateDueRides = async () => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dayOfWeek = now.getDay();
  const hhmm = now.toTimeString().slice(0, 5);
  try {
    const due = await RecurringRide.find({ active: true, daysOfWeek: dayOfWeek, lastGeneratedDate: { $ne: today } });
    for (const r of due) {
      if (r.time > hhmm) continue;
      const distance = getDistance(r.pickupLocation, r.dropoffLocation);
      const rate = RIDE_RATES[r.rideType] || RIDE_RATES.car;
      const fare = Math.round(rate.base + rate.per * distance);
      const created = await Ride.create({
        passenger: r.passenger, pickupLocation: r.pickupLocation, dropoffLocation: r.dropoffLocation,
        fare, distance, rideType: r.rideType, paymentMethod: r.paymentMethod, recurringRideId: r._id,
        rideCategory: "standard",
      });
      notifyRide(created, "booked");
      r.lastGeneratedDate = today;
      await r.save();
      console.log(`[Recurring] Created ride for ${r.passenger} (${r.rideType}, ${distance}km, ₹${fare})`);
    }
  } catch (e) { console.error("Recurring ride generation error:", e.message); }
};

// Runs every 5 minutes (demo-friendly, so newly created recurring rides are testable same-day
// rather than waiting for a real midnight cron). Tighten to daily at 00:05 for production use.
const startScheduler = () => cron.schedule("*/5 * * * *", generateDueRides);

module.exports = { startScheduler, generateDueRides };
