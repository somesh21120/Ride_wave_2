const RecurringRide = require("../models/RecurringRide");

const createRecurring = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, rideType, paymentMethod, time, daysOfWeek } = req.body;
    if (!pickupLocation || !dropoffLocation) return res.status(400).json({ message: "Pickup and dropoff are required" });
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ message: "Time must be in HH:MM format" });
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) return res.status(400).json({ message: "Select at least one day" });
    const doc = await RecurringRide.create({ passenger: req.user._id, pickupLocation, dropoffLocation, rideType, paymentMethod, time, daysOfWeek });
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const getMyRecurring = async (req, res) => {
  try {
    const rides = await RecurringRide.find({ passenger: req.user._id }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const updateRecurring = async (req, res) => {
  try {
    const doc = await RecurringRide.findOne({ _id: req.params.id, passenger: req.user._id });
    if (!doc) return res.status(404).json({ message: "Recurring ride not found" });
    ["pickupLocation", "dropoffLocation", "rideType", "paymentMethod", "time", "daysOfWeek", "active"].forEach((k) => {
      if (req.body[k] !== undefined) doc[k] = req.body[k];
    });
    await doc.save();
    res.json(doc);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const deleteRecurring = async (req, res) => {
  try {
    const doc = await RecurringRide.findOneAndDelete({ _id: req.params.id, passenger: req.user._id });
    if (!doc) return res.status(404).json({ message: "Recurring ride not found" });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
module.exports = { createRecurring, getMyRecurring, updateRecurring, deleteRecurring };
