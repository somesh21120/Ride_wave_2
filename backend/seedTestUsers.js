// Creates or resets the demo accounts (admin, driver, two passengers).
// Usage: node seedTestUsers.js   (RIDEWAVE_TOOLS.bat option 4)
// Works with an online MONGO_URI and with MONGO_URI=local (reuses the running local database).
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const { resolveMongoUri } = require("./config/localMongo");
const { DEMO_USERS } = require("./config/seedDemo");

(async () => {
  try {
    await mongoose.connect(await resolveMongoUri(process.env.MONGO_URI), { serverSelectionTimeoutMS: 15000 });
    console.log("Connected to MongoDB");
    for (const u of DEMO_USERS) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        Object.assign(existing, { password: u.password, phone: u.phone, role: u.role, isActive: true });
        if (u.vehicle) existing.vehicle = u.vehicle;
        await existing.save();
        console.log(`Reset:   ${u.email} / ${u.password}`);
      } else {
        await User.create(u);
        console.log(`Created: ${u.email} / ${u.password}`);
      }
    }
    await mongoose.disconnect();
    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
})();
