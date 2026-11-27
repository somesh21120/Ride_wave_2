/**
 * Demo accounts, created automatically when the database has no users yet
 * (a fresh local database or a new empty Atlas cluster). Turn off with SEED_DEMO=off.
 * The same list is used by seedTestUsers.js.
 */
const DEMO_USERS = [
  {
    name: process.env.ADMIN_NAME || "RideWave Admin",
    email: process.env.ADMIN_EMAIL || "admin@ridewave.app",
    password: process.env.ADMIN_PASSWORD || "Admin@123",
    phone: "0000000000",
    role: "admin",
  },
  { name: "Test Passenger", email: "passenger@test.com", password: "pass123", phone: "1234567890", role: "passenger" },
  { name: "Test Passenger 2", email: "passenger2@test.com", password: "pass456", phone: "1122334455", role: "passenger" },
  {
    name: "Test Driver",
    email: "driver@test.com",
    password: "drive123",
    phone: "0987654321",
    role: "driver",
    vehicle: { type: "car", model: "Maruti Swift", number: "GJ 03 AB 1234", carSubtype: "Hatchback", seatingCapacity: 5 },
  },
];

/** Creates the demo users only if the users collection is empty. Returns the number created. */
async function seedDemoIfEmpty(User) {
  if (String(process.env.SEED_DEMO || "").toLowerCase() === "off") return 0;
  const count = await User.estimatedDocumentCount();
  if (count > 0) return 0;
  for (const u of DEMO_USERS) await User.create(u); // create() runs the password hashing hook
  console.log("[db] Empty database: demo accounts created (admin@ridewave.app, driver@test.com, passenger@test.com).");
  return DEMO_USERS.length;
}

module.exports = { DEMO_USERS, seedDemoIfEmpty };
