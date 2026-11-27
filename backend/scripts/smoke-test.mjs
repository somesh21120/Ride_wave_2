/**
 * Smoke test for RideWave.
 *
 * Walks through the full ride lifecycle via the real HTTP API against
 * the test database. Must never run against production.
 *
 * Usage:
 *   set MONGO_URI=<test-db> && node backend/scripts/smoke-test.mjs
 *   (or put MONGO_URI_TEST in .env and this script reads it)
 *
 * Exits with code 0 on success, 1 on failure.
 */

const BASE = process.env.TEST_BASE_URL || "http://localhost:5000/api";
let failed = 0;

async function req(method, path, body, token) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function check(label, condition) {
  if (!condition) {
    console.error(`❌ FAIL: ${label}`);
    failed++;
  } else {
    console.log(`  ✅ ${label}`);
  }
}

async function main() {
  console.log("\n=== RIDEWAVE SMOKE TEST ===\n");

  // 1. Health endpoint
  console.log("1. Health endpoint");
  const health = await req("GET", "/health");
  check("returns 200", health.status === 200);
  check("status is ok", health.data.status === "ok");
  check("db is connected", health.data.db === "connected" || health.data.db === true);

  // 2. 404 for unknown route
  console.log("\n2. Unknown route returns JSON 404");
  const notFound = await req("GET", "/nothing");
  check("returns 404", notFound.status === 404);
  check("body has message", typeof notFound.data.message === "string");

  // 3. Register passenger
  console.log("\n3. Register accounts");
  const pass = await req("POST", "/auth/register", {
    name: "Smoke Passenger",
    email: `smoke-pass-${Date.now()}@test.com`,
    password: "Test@123",
    phone: "9999999901",
    role: "passenger",
    otp: "123456",
  });
  check("passenger registered", pass.status === 201 || pass.status === 200);
  const passToken = pass.data?.token;
  check("passenger has token", !!passToken);

  // 4. Register driver
  const driver = await req("POST", "/auth/register", {
    name: "Smoke Driver",
    email: `smoke-drv-${Date.now()}@test.com`,
    password: "Test@123",
    phone: "9999999902",
    role: "driver",
    otp: "123456",
    vehicleType: "car",
    vehicleModel: "Test Car",
    vehicleNumber: "GJ-01-XX-9999",
    carSubtype: "sedan",
    seatingCapacity: 4,
  });
  check("driver registered", driver.status === 201 || driver.status === 200);
  const driverToken = driver.data?.token;
  check("driver has token", !!driverToken);

  // 5. Register a second driver (for double-accept test)
  const driver2 = await req("POST", "/auth/register", {
    name: "Smoke Driver 2",
    email: `smoke-drv2-${Date.now()}@test.com`,
    password: "Test@123",
    phone: "9999999903",
    role: "driver",
    otp: "123456",
    vehicleType: "car",
    vehicleModel: "Test Car 2",
    vehicleNumber: "GJ-01-YY-8888",
    carSubtype: "sedan",
    seatingCapacity: 4,
  });
  check("driver 2 registered", driver2.status === 201 || driver2.status === 200);
  const driver2Token = driver2.data?.token;

  // 6. Book a ride
  console.log("\n4. Book a ride");
  const book = await req("POST", "/rides/book", {
    pickupLocation: { address: "Test Pickup", lat: 22.3039, lng: 70.8022 },
    dropoffLocation: { address: "Test Dropoff", lat: 22.3000, lng: 70.8000 },
    rideType: "car",
    paymentMethod: "cash",
    distance: 5,
  }, passToken);
  check("ride booked", book.status === 201 || book.status === 200);
  const rideId = book.data?.ride?._id || book.data?._id;
  check("ride has an ID", !!rideId);
  check("ride is requested", book.data?.ride?.status === "requested" || book.data?.status === "requested");

  // 7. Accept the ride
  console.log("\n5. Accept the ride");
  const accept = await req("PUT", `/rides/${rideId}/accept`, {}, driverToken);
  check("accept succeeds", accept.status === 200);
  check("ride is now accepted", accept.data?.ride?.status === "accepted" || accept.data?.status === "accepted");

  // 8. Second driver cannot accept the same ride
  console.log("\n6. Double-accept is blocked");
  const doubleAccept = await req("PUT", `/rides/${rideId}/accept`, {}, driver2Token);
  check("second driver gets 409 or 400", doubleAccept.status === 409 || doubleAccept.status === 400);

  // 9. Start the ride
  console.log("\n7. Start the ride");
  const noOtp = await req("PUT", `/rides/${rideId}/start`, {}, driverToken);
  check("start without the ride code is refused", noOtp.status === 400);
  const wrongOtp = await req("PUT", `/rides/${rideId}/start`, { otp: "0000" }, driverToken);
  check("start with a wrong ride code is refused", wrongOtp.status === 400);
  const passRides = await req("GET", "/rides/my-rides", {}, passToken);
  const otp = (passRides.data || []).find((r) => r._id === rideId)?.startOtp;
  check("passenger can see the 4-digit ride code", /^\d{4}$/.test(otp || ""));
  check("driver's accept response does not reveal the code", !accept.data?.startOtp && !accept.data?.ride?.startOtp);
  const start = await req("PUT", `/rides/${rideId}/start`, { otp }, driverToken);
  check("start succeeds", start.status === 200);
  check("ride is ongoing", start.data?.ride?.status === "ongoing" || start.data?.status === "ongoing");

  // 10. Complete the ride
  console.log("\n8. Complete the ride");
  const complete = await req("PUT", `/rides/${rideId}/complete`, {}, driverToken);
  check("complete succeeds", complete.status === 200);
  check("ride is completed", complete.data?.ride?.status === "completed" || complete.data?.status === "completed");

  // 11. Illegal transition: complete an already completed ride
  console.log("\n9. Illegal transitions are rejected");
  const reComplete = await req("PUT", `/rides/${rideId}/complete`, {}, driverToken);
  check("re-completing fails", reComplete.status === 400);

  // 12. My rides works for passenger
  console.log("\n10. My rides endpoint");
  const myRides = await req("GET", "/rides/my-rides", {}, passToken);
  check("my-rides returns 200", myRides.status === 200);
  check("has at least one ride", Array.isArray(myRides.data?.rides || myRides.data) && (myRides.data?.rides || myRides.data).length > 0);

  // Summary
  console.log(`\n=== RESULTS: ${failed} failures ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});