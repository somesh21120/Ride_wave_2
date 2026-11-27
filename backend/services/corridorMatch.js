/**
 * Route-corridor pool matching (RideWave v2, research contribution).
 *
 * Idea
 * ----
 * The Sem 7 matcher (proximity v1) pools riders only when BOTH their pickup and their
 * drop-off are within 1.5 km of the first rider's. Daily commuters rarely start and end at
 * the same spots; they travel along the same main roads. Corridor matching treats the lead
 * rider's route as a corridor and accepts any rider whose trip lies along it:
 *
 *   1. Project the candidate's pickup and drop-off onto the lead route (polyline).
 *   2. Both must be close to the route (off-route distance limit) and in the same direction
 *      (pickup before drop-off along the route).
 *   3. The shared part must cover most of the candidate's own trip (overlap ratio).
 *   4. The extra distance the vehicle drives to serve the candidate (detour) must stay
 *      within an absolute limit and a limit relative to the route. A stop in the middle of
 *      the route costs a trip off the road and back (2 x off-route distance); a stop before
 *      the start or after the end of the route costs it once (the car simply starts earlier
 *      or ends later).
 *   5. Candidates are added greedily, best overlap first, until seats or the total detour
 *      budget run out.
 *   6. Spine selection: the corridor is not always the first rider's trip. If the first
 *      rider's trip lies inside a longer trip, the longer trip is used as the corridor
 *      (the first rider must always be in the group). The grouping with the most riders,
 *      then the least detour, wins.
 *
 * Fares are split segment by segment: every kilometre of the route is shared equally by
 * the riders in the vehicle on that kilometre; each rider pays for their own detour; the
 * base fare is shared equally. Every rider is guaranteed to pay at most (1 - minSaving) of
 * their solo fare.
 *
 * Everything here is a pure function (no database, no network), so it is unit tested in
 * tests/corridorMatch.test.js and reused by scripts/simulate-pooling.js.
 * Distances are in kilometres. Points are { lat, lng }. A route is an array of points.
 */

const RATES = {
  bike: { base: 20, per: 8 },
  auto: { base: 30, per: 12 },
  car: { base: 50, per: 18 },
};

const DEFAULTS = {
  maxOffRouteKm: 1.5,      // pickup / drop-off may be at most this far from the route (same tolerance as Sem 7)
  minOverlapRatio: 0.6,    // shared km must be >= 60% of the candidate's own trip
  minSharedKm: 1.0,        // ignore tiny overlaps
  maxDetourKm: 3.0,        // extra driving per added rider
  maxDetourRatio: 0.35,    // total extra driving <= 35% of the lead's trip
  minSaving: 0.1,          // every rider saves at least 10% versus riding solo
};

const PROXIMITY_RADIUS_KM = 1.5; // Sem 7 rule, kept as the baseline

// ---------- geometry ----------

const toRad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in km (haversine). */
const haversineKm = (a, b) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

/** Local flat projection (km) around a reference latitude; accurate within a city. */
const toXY = (p, refLat) => ({
  x: toRad(p.lng) * 6371 * Math.cos(toRad(refLat)),
  y: toRad(p.lat) * 6371,
});

const routeLengthKm = (route) => {
  let len = 0;
  for (let i = 1; i < route.length; i++) len += haversineKm(route[i - 1], route[i]);
  return len;
};

/** Straight-line route with intermediate points (used when no road route is available). */
const straightRoute = (a, b, steps = 10) => {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
  }
  return pts;
};

/**
 * Project a point onto a polyline.
 * Returns { offRouteKm, alongKm }: distance from the route and position along it.
 */
const projectOnRoute = (point, route) => {
  if (!route || route.length < 2) throw new Error("Route needs at least 2 points");
  const refLat = route[0].lat;
  const p = toXY(point, refLat);
  let best = { offRouteKm: Infinity, alongKm: 0 };
  let walked = 0;
  for (let i = 1; i < route.length; i++) {
    const a = toXY(route[i - 1], refLat);
    const b = toXY(route[i], refLat);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.hypot(dx, dy);
    let t = segLen === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / (segLen * segLen);
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    const off = Math.hypot(p.x - cx, p.y - cy);
    if (off < best.offRouteKm) best = { offRouteKm: off, alongKm: walked + t * segLen };
    walked += segLen;
  }
  return best;
};

// ---------- fares ----------

const soloFare = (km, rideType) => {
  const r = RATES[rideType] || RATES.car;
  return Math.round(r.base + r.per * km);
};

// ---------- matching ----------

/**
 * Check one candidate against the lead route.
 * rider: { id, pickup, dropoff }  route: lead route (array of points)
 */
const evaluateCandidate = (route, rider, opts = {}) => {
  const o = { ...DEFAULTS, ...opts };
  const routeKm = routeLengthKm(route);
  const directKm = haversineKm(rider.pickup, rider.dropoff);
  const pu = projectOnRoute(rider.pickup, route);
  const dr = projectOnRoute(rider.dropoff, route);
  const sharedKm = Math.max(0, dr.alongKm - pu.alongKm);
  // Mid-route stop: leave the route and come back (2x). Stop before the start or after
  // the end of the route: the car just starts earlier / ends later (1x).
  const EDGE = 0.05; // km
  const puFactor = pu.alongKm <= EDGE ? 1 : 2;
  const drFactor = dr.alongKm >= routeKm - EDGE ? 1 : 2;
  const detourKm = puFactor * pu.offRouteKm + drFactor * dr.offRouteKm;
  const result = {
    id: rider.id,
    ok: false,
    reason: null,
    routeKm,
    directKm,
    pickupAlongKm: pu.alongKm,
    dropAlongKm: dr.alongKm,
    pickupOffKm: pu.offRouteKm,
    dropOffKm: dr.offRouteKm,
    sharedKm,
    detourKm,
    overlapRatio: directKm > 0 ? sharedKm / directKm : 0,
  };
  if (pu.offRouteKm > o.maxOffRouteKm) result.reason = "pickup too far from route";
  else if (dr.offRouteKm > o.maxOffRouteKm) result.reason = "drop-off too far from route";
  else if (dr.alongKm <= pu.alongKm) result.reason = "opposite direction";
  else if (sharedKm < o.minSharedKm) result.reason = "shared distance too short";
  else if (result.overlapRatio < o.minOverlapRatio) result.reason = "too little of the trip is shared";
  else if (detourKm > o.maxDetourKm) result.reason = "detour too long";
  else result.ok = true;
  return result;
};

/**
 * Corridor matching for one lead.
 * lead: { id, pickup, dropoff }, candidates: same shape, capacity: max riders incl. lead.
 * route: optional road route for the lead (array of points); straight line if missing.
 * Returns { route, routeKm, members: [evaluation...], rejected: [evaluation...], totalDetourKm }.
 */
const matchCorridor = (lead, candidates, { capacity = 3, route = null, opts = {} } = {}) => {
  const o = { ...DEFAULTS, ...opts };
  const r = route && route.length >= 2 ? route : straightRoute(lead.pickup, lead.dropoff);
  const routeKm = routeLengthKm(r);
  const evals = candidates.map((c) => evaluateCandidate(r, c, o));
  // Optional AI ranking: opts.score(evaluation, routeKm) returns a predicted acceptance
  // probability; pairs below opts.minScore are not offered (see ml/pairingModel.js).
  if (typeof o.score === "function") {
    for (const e of evals) {
      if (!e.ok) continue;
      e.score = o.score(e, routeKm);
      if (o.minScore != null && e.score < o.minScore) { e.ok = false; e.reason = "low predicted acceptance"; }
    }
  }
  const eligible = evals
    .filter((e) => e.ok)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.sharedKm - a.sharedKm || a.detourKm - b.detourKm);
  const budget = o.maxDetourRatio * routeKm;
  const members = [];
  let totalDetourKm = 0;
  for (const e of eligible) {
    if (members.length + 1 >= capacity) break;
    if (totalDetourKm + e.detourKm > budget) { e.ok = false; e.reason = "detour budget used up"; continue; }
    members.push(e);
    totalDetourKm += e.detourKm;
  }
  const memberIds = new Set(members.map((m) => m.id));
  return {
    route: r,
    routeKm,
    members,
    rejected: evals.filter((e) => !memberIds.has(e.id)),
    totalDetourKm,
  };
};

/**
 * Corridor matching with spine selection.
 * Tries the lead's own trip as the corridor, then each candidate's longer trip that the
 * lead fits inside. The lead is always kept in the group. Picks the grouping with the most
 * riders, then the least total detour.
 * routeFor(rider) may return a road route; defaults to a straight line.
 * Returns the matchCorridor result plus { spine } (the rider whose trip is the corridor).
 */
const matchCorridorBestSpine = (lead, candidates, { capacity = 3, routeFor = null, opts = {}, maxSpines = 6 } = {}) => {
  const o = { ...DEFAULTS, ...opts };
  const getRoute = (r) => (routeFor && routeFor(r)) || straightRoute(r.pickup, r.dropoff);
  let best = { ...matchCorridor(lead, candidates, { capacity, route: getRoute(lead), opts: o }), spine: lead };
  if (best.members.length + 1 >= capacity) return best;

  const longer = candidates
    .filter((c) => haversineKm(c.pickup, c.dropoff) > haversineKm(lead.pickup, lead.dropoff))
    .sort((a, b) => haversineKm(b.pickup, b.dropoff) - haversineKm(a.pickup, a.dropoff))
    .slice(0, maxSpines);

  for (const spine of longer) {
    const route = getRoute(spine);
    const leadEval = evaluateCandidate(route, lead, o);
    if (!leadEval.ok) continue;
    const others = candidates.filter((c) => c.id !== spine.id);
    // Reserve a seat for the lead, then fill the rest
    const rest = matchCorridor(spine, others.filter((c) => c.id !== lead.id), { capacity: capacity - 1, route, opts: o });
    const budget = o.maxDetourRatio * rest.routeKm;
    if (rest.totalDetourKm + leadEval.detourKm > budget) continue;
    const members = [leadEval, ...rest.members];
    const total = rest.totalDetourKm + leadEval.detourKm;
    const better = members.length > best.members.length ||
      (members.length === best.members.length && total < best.totalDetourKm);
    if (better) best = { route, routeKm: rest.routeKm, members, rejected: rest.rejected, totalDetourKm: total, spine };
  }
  return best;
};

/**
 * Sem 7 baseline: pickup AND drop-off within radius of the lead's.
 * Same return shape as matchCorridor (members carry directKm, sharedKm, detourKm estimates).
 */
const matchProximity = (lead, candidates, { capacity = 3, radiusKm = PROXIMITY_RADIUS_KM } = {}) => {
  const members = [];
  for (const c of candidates) {
    if (members.length + 1 >= capacity) break;
    const p = haversineKm(lead.pickup, c.pickup);
    const d = haversineKm(lead.dropoff, c.dropoff);
    if (p <= radiusKm && d <= radiusKm) {
      const directKm = haversineKm(c.pickup, c.dropoff);
      members.push({ id: c.id, ok: true, directKm, sharedKm: Math.min(directKm, haversineKm(lead.pickup, lead.dropoff)), detourKm: p + d });
    }
  }
  return { members, totalDetourKm: members.reduce((s, m) => s + m.detourKm, 0) };
};

/**
 * Segment-wise fair fare split for a corridor pool.
 * lead: { id }, members: evaluations from matchCorridor, routeKm: lead route length.
 * Returns [{ id, fare, soloFare, saving, sharedKm, detourKm }], lead first.
 */
const splitFare = ({ lead, members, routeKm, rideType = "car", minSaving = DEFAULTS.minSaving, soloKm = null }) => {
  const rate = RATES[rideType] || RATES.car;
  const riders = [
    { id: lead.id, from: 0, to: routeKm, detourKm: 0, directKm: routeKm },
    ...members.map((m) => ({ id: m.id, from: m.pickupAlongKm, to: m.dropAlongKm, detourKm: m.detourKm, directKm: m.directKm })),
  ];
  const cost = Object.fromEntries(riders.map((r) => [r.id, rate.base / riders.length + rate.per * r.detourKm]));
  const cuts = [...new Set(riders.flatMap((r) => [r.from, r.to]).concat([0, routeKm]))].sort((a, b) => a - b);
  for (let i = 1; i < cuts.length; i++) {
    const a = cuts[i - 1];
    const b = cuts[i];
    const mid = (a + b) / 2;
    const onboard = riders.filter((r) => r.from <= mid && r.to >= mid);
    if (!onboard.length) continue;
    const share = (rate.per * (b - a)) / onboard.length;
    onboard.forEach((r) => { cost[r.id] += share; });
  }
  return riders.map((r) => {
    // soloKm lets the app use each ride's booked distance (what the rider was quoted)
    const solo = soloFare(soloKm && soloKm[r.id] != null ? soloKm[r.id] : r.directKm, rideType);
    const capped = Math.min(cost[r.id], solo * (1 - minSaving));
    const fare = Math.max(1, Math.round(capped));
    return {
      id: r.id,
      fare,
      soloFare: solo,
      saving: solo - fare,
      sharedKm: Number((r.to - r.from).toFixed(2)),
      detourKm: Number(r.detourKm.toFixed(2)),
    };
  });
};

/** Estimated fare saving (%) for one candidate pooled with the route's rider. */
const estimateSavingPct = (evaluation, routeKm, rideType = "car") => {
  const f = splitFare({ lead: { id: "__route" }, members: [evaluation], routeKm, rideType });
  const c = f[1];
  return c.soloFare > 0 ? (100 * c.saving) / c.soloFare : 0;
};

/** One-line, human-readable reason shown to the rider ("why you were matched"). */
const explainMatch = ({ sharedKm, detourKm, saving }) =>
  `Shares ${sharedKm.toFixed(1)} km of the route, adds ${detourKm.toFixed(1)} km detour, saves ₹${saving}`;

module.exports = {
  RATES,
  DEFAULTS,
  PROXIMITY_RADIUS_KM,
  haversineKm,
  routeLengthKm,
  straightRoute,
  projectOnRoute,
  soloFare,
  evaluateCandidate,
  matchCorridor,
  matchCorridorBestSpine,
  matchProximity,
  splitFare,
  estimateSavingPct,
  explainMatch,
};
