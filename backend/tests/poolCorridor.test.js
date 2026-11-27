// Live corridor pooling step with fake ride documents (no database, no network).
process.env.ROUTING = "off";
const test = require("node:test");
const assert = require("node:assert");
const { corridorStep } = require("../services/poolMatchService");

const A = { lat: 22.28, lng: 70.80 };
const at = (km, offKm = 0, address = "") => ({ address: address || `km ${km}`, lat: A.lat + km * 0.009, lng: A.lng + offKm * 0.0097 });
let n = 0;
const fakeRide = (pickup, dropoff, distance) => ({
  _id: `ride${++n}`,
  passenger: `user${n}`,
  pickupLocation: pickup,
  dropoffLocation: dropoff,
  distance,
  rideType: "car",
  fare: 0,
  status: "requested",
  saved: 0,
  async save() { this.saved += 1; },
});

test("corridor step pools riders along one road and writes fares, notes and co-riders", async () => {
  const lead = fakeRide(at(0), at(10), 10);
  const c1 = fakeRide(at(2, 0.2), at(8, 0.2), 6);   // along the road: proximity would reject
  const far = fakeRide(at(2, 3), at(8, 3), 6);      // parallel road 3 km away: rejected
  const done = await corridorStep(lead, [c1, far], 3, true);

  assert.deepStrictEqual(done.sort(), [String(c1._id), String(lead._id)].sort());
  assert.strictEqual(lead.poolMatchStatus, "matched");
  assert.strictEqual(lead.poolMatcher, "corridor");
  assert.strictEqual(lead.coRiders.length, 1);
  assert.ok(lead.coRiders[0].sharedKm > 5);
  assert.strictEqual(c1.status, "cancelled");             // absorbed into the lead ride
  assert.strictEqual(String(c1.poolMatchedRide), String(lead._id));
  assert.match(c1.poolMatchNote, /^Shares .* km of the route/);
  assert.ok(lead.fare < 230 && c1.fare < 50 + 18 * 6);      // both below solo fares
  assert.strictEqual(far.poolMatchStatus, undefined);       // untouched
});

test("no match before the window ends: wait; after it ends: revert to solo", async () => {
  const lone = fakeRide(at(0), at(10), 10);
  assert.deepStrictEqual(await corridorStep(lone, [], 3, false), []);
  const done = await corridorStep(lone, [], 3, true);
  assert.deepStrictEqual(done, [String(lone._id)]);
  assert.strictEqual(lone.poolMatchStatus, "reverted_to_solo");
  assert.strictEqual(lone.fare, 230);
});
