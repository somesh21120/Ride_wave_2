const test = require("node:test");
const assert = require("node:assert");
const { calcFare, getDistance } = require("../services/poolMatchService");

test("fare = base + per-km rate, rounded", () => {
  assert.strictEqual(calcFare(10, "bike"), 100); // 20 + 8*10
  assert.strictEqual(calcFare(10, "auto"), 150); // 30 + 12*10
  assert.strictEqual(calcFare(10, "car"), 230); // 50 + 18*10
});

test("pool fare is cheaper than solo", () => {
  assert.ok(calcFare(8, "car", true) < calcFare(8, "car", false));
});

test("unknown ride type falls back to car rates", () => {
  assert.strictEqual(calcFare(1, "boat"), calcFare(1, "car"));
});

test("haversine distance is sane (Rajkot: Race Course to Marwadi University ~ 10 km)", () => {
  const d = getDistance({ lat: 22.3008, lng: 70.7926 }, { lat: 22.3693, lng: 70.7980 });
  assert.ok(d > 6 && d < 10, `got ${d}`);
});
