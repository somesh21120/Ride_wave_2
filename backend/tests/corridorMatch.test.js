// Corridor matching unit tests. Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const {
  haversineKm, straightRoute, projectOnRoute, evaluateCandidate,
  matchCorridor, matchProximity, splitFare, soloFare, explainMatch,
} = require("../services/corridorMatch");

// A straight north-south corridor in Rajkot, about 10 km long
const A = { lat: 22.28, lng: 70.80 };
const B = { lat: 22.37, lng: 70.80 };
const route = straightRoute(A, B, 20);
const lead = { id: "lead", pickup: A, dropoff: B };
// ~0.009 degrees latitude is ~1 km; ~0.0097 degrees longitude is ~1 km at this latitude
const along = (km, offKm = 0) => ({ lat: A.lat + km * 0.009, lng: A.lng + offKm * 0.0097 });

test("projection finds distance along and off the route", () => {
  const p = projectOnRoute(along(4, 0.5), route);
  assert.ok(Math.abs(p.alongKm - 4) < 0.2, `along ${p.alongKm}`);
  assert.ok(Math.abs(p.offRouteKm - 0.5) < 0.05, `off ${p.offRouteKm}`);
});

test("rider travelling along the corridor is accepted", () => {
  const e = evaluateCandidate(route, { id: "c1", pickup: along(2, 0.3), dropoff: along(8, 0.2) });
  assert.strictEqual(e.ok, true, e.reason);
  assert.ok(e.sharedKm > 5.5 && e.sharedKm < 6.5);
  assert.ok(e.detourKm > 0.9 && e.detourKm < 1.1);
});

test("opposite direction, far from route, short overlap and long detour are rejected", () => {
  assert.strictEqual(evaluateCandidate(route, { id: "x", pickup: along(8), dropoff: along(2) }).reason, "opposite direction");
  assert.strictEqual(evaluateCandidate(route, { id: "x", pickup: along(3, 2), dropoff: along(8) }).reason, "pickup too far from route");
  assert.strictEqual(evaluateCandidate(route, { id: "x", pickup: along(3), dropoff: along(3.5) }).reason, "shared distance too short");
  assert.strictEqual(
    evaluateCandidate(route, { id: "x", pickup: along(2, 0.9), dropoff: along(8, 0.9) }, { maxDetourKm: 3 }).reason,
    "detour too long"
  );
});

test("corridor matching pools riders that proximity matching misses", () => {
  // Pickup 2 km after the lead's, drop-off 2 km before: same road, different stops
  const cand = { id: "c1", pickup: along(2, 0.2), dropoff: along(8, 0.2) };
  assert.strictEqual(matchProximity(lead, [cand]).members.length, 0);
  assert.strictEqual(matchCorridor(lead, [cand], { route }).members.length, 1);
});

test("capacity and detour budget are respected", () => {
  const cands = [1, 2, 3, 4].map((i) => ({ id: `c${i}`, pickup: along(i, 0.2), dropoff: along(i + 5, 0.2) }));
  const res = matchCorridor(lead, cands, { capacity: 3, route });
  assert.strictEqual(res.members.length, 2); // lead + 2 = 3 seats
  const tight = matchCorridor(lead, cands, { capacity: 5, route, opts: { maxDetourRatio: 0.1 } });
  assert.ok(tight.totalDetourKm <= 0.1 * tight.routeKm + 1e-9);
});

test("fare split: everyone saves, shared km cost less, fares never exceed solo", () => {
  const res = matchCorridor(lead, [{ id: "c1", pickup: along(2, 0.2), dropoff: along(8, 0.2) }], { route });
  const fares = splitFare({ lead, members: res.members, routeKm: res.routeKm, rideType: "car" });
  assert.strictEqual(fares.length, 2);
  for (const f of fares) {
    assert.ok(f.fare <= Math.round(f.soloFare * 0.9) + 1, `${f.id} ${f.fare} vs solo ${f.soloFare}`);
    assert.ok(f.saving > 0);
  }
  // Lead rides the whole route alone for 4 of 10 km, so pays more than the co-rider
  assert.ok(fares[0].fare > fares[1].fare);
});

test("solo fare matches the Sem 7 rates", () => {
  assert.strictEqual(soloFare(10, "car"), 230);
  assert.strictEqual(soloFare(10, "auto"), 150);
});

test("explanation text", () => {
  assert.strictEqual(explainMatch({ sharedKm: 4.25, detourKm: 0.8, saving: 38 }), "Shares 4.3 km of the route, adds 0.8 km detour, saves ₹38");
});

test("haversine sanity", () => {
  const d = haversineKm(A, B);
  assert.ok(d > 9.8 && d < 10.2, `got ${d}`);
});

test("stop before the route start costs the detour once, mid-route stop twice", () => {
  const { matchCorridorBestSpine } = require("../services/corridorMatch");
  void matchCorridorBestSpine;
  const before = evaluateCandidate(route, { id: "b", pickup: { lat: A.lat - 0.009, lng: A.lng }, dropoff: along(8) });
  assert.ok(Math.abs(before.detourKm - 1) < 0.1, `before-start detour ${before.detourKm}`);
  const mid = evaluateCandidate(route, { id: "m", pickup: along(3, 0.5), dropoff: along(8) });
  assert.ok(Math.abs(mid.detourKm - 1) < 0.1, `mid detour ${mid.detourKm}`); // 2 x 0.5 km
});

test("spine selection: a short first request joins a longer trip it lies inside", () => {
  const { matchCorridorBestSpine } = require("../services/corridorMatch");
  const shortLead = { id: "short", pickup: along(3, 0.1), dropoff: along(7, 0.1) };
  const longTrip = { id: "long", pickup: along(0), dropoff: along(10) };
  const res = matchCorridorBestSpine(shortLead, [longTrip], { capacity: 3 });
  assert.strictEqual(res.spine.id, "long");
  assert.deepStrictEqual(res.members.map((m) => m.id), ["short"]);
});
