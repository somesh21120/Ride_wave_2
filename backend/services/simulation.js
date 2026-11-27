/**
 * RideWave simulation engine (synthetic data only).
 *
 * Shared by:
 *   scripts/simulate-pooling.js      results tables and charts for the report
 *   scripts/train-pairing-model.js   data collection + training of the AI pairing model
 *   /api/lab/*                       the Pooling Lab page (live visual demo)
 *
 * It generates Rajkot morning-commute requests, runs a matcher over them in 2-minute
 * windows (same as the live app), offers each pool to the riders, and simulates whether
 * each rider accepts. Rider behaviour follows a hidden "ground truth" model with a
 * personal tolerance per rider, so the AI has to learn it from collected data; it never
 * sees the formula.
 *
 * Matchers ("modes"):
 *   proximity  Sem 7 rule (stops within 1.5 km)
 *   corridor   Sem 8 route-corridor matching with spine selection
 *   smart      corridor + AI ranking by predicted acceptance (needs a trained model)
 */
const {
  haversineKm, straightRoute, routeLengthKm, evaluateCandidate, matchCorridorBestSpine, matchProximity,
  splitFare, soloFare, estimateSavingPct,
} = require("./corridorMatch");
const { pairFeatures } = require("../ml/features");
const { predictProba, sigmoid } = require("../ml/logistic");

const WINDOW_MIN = 2;
const CAPACITY = 3;
const RIDE_TYPE = "car";
const JITTER_KM = 1.0;
const SEM7_TIERS = { 2: 0.70, 3: 0.55 };
const SMART_MIN_SCORE = 0.35; // do not offer pairs the model thinks are unlikely to be accepted

// Approximate locations in Rajkot (simulation only)
const ORIGINS = [
  { name: "Kalawad Road", lat: 22.2770, lng: 70.7650, w: 3 },
  { name: "Raiya Road", lat: 22.3010, lng: 70.7700, w: 3 },
  { name: "University Road", lat: 22.2900, lng: 70.7750, w: 2 },
  { name: "Mavdi", lat: 22.2650, lng: 70.7830, w: 2 },
  { name: "Kothariya", lat: 22.2530, lng: 70.8030, w: 2 },
  { name: "Bhaktinagar", lat: 22.2830, lng: 70.8160, w: 2 },
  { name: "Gandhigram", lat: 22.3060, lng: 70.7830, w: 2 },
  { name: "Madhapar", lat: 22.3260, lng: 70.7700, w: 1 },
  { name: "Nana Mava", lat: 22.2760, lng: 70.7790, w: 2 },
  { name: "Mota Mava", lat: 22.2700, lng: 70.7560, w: 1 },
];
const HUBS = [
  { name: "Marwadi University", lat: 22.3693, lng: 70.7980, w: 4 },
  { name: "Rajkot Junction", lat: 22.3120, lng: 70.8030, w: 2 },
  { name: "Race Course / offices", lat: 22.3010, lng: 70.7960, w: 3 },
  { name: "Aji GIDC", lat: 22.2700, lng: 70.8400, w: 2 },
  { name: "Bus Port", lat: 22.2960, lng: 70.8010, w: 1 },
];

// ---------- randomness ----------
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gaussian = (rand) => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};
const pickWeighted = (rand, list) => {
  const total = list.reduce((s, x) => s + x.w, 0);
  let r = rand() * total;
  for (const x of list) { r -= x.w; if (r <= 0) return x; }
  return list[list.length - 1];
};
const jitter = (rand, p) => {
  const ang = rand() * 2 * Math.PI;
  const dist = Math.sqrt(rand()) * JITTER_KM;
  return { lat: p.lat + (dist * Math.sin(ang)) / 111, lng: p.lng + (dist * Math.cos(ang)) / (111 * Math.cos((p.lat * Math.PI) / 180)) };
};

// ---------- demand ----------
const generateRequests = ({ seed = 1, perHour = 120, minutes = 60 } = {}) => {
  const rand = mulberry32(seed);
  const n = Math.round((perHour * minutes) / 60);
  const reqs = [];
  let guard = 0;
  while (reqs.length < n && guard++ < n * 20) {
    const o = pickWeighted(rand, ORIGINS);
    const h = pickWeighted(rand, HUBS);
    const pickup = jitter(rand, o);
    const dropoff = jitter(rand, h);
    if (haversineKm(pickup, dropoff) < 1.5) continue;
    reqs.push({
      id: `r${reqs.length}`,
      t: rand() * minutes,
      pickup,
      dropoff,
      from: o.name,
      to: h.name,
      tolerance: gaussian(rand) * 0.8, // hidden personal preference, never given to the AI
    });
  }
  return reqs.sort((a, b) => a.t - b.t);
};

// ---------- hidden rider behaviour (ground truth) ----------
const trueAcceptProb = (f, tolerance) => sigmoid(
  -0.6 + 0.09 * f.savingPct - 0.8 * f.detourKm - 0.35 * f.waitMin
  + 2.0 * (f.overlapRatio - 0.75) - 0.6 * (f.pickupOffKm + f.dropOffKm) + tolerance
);

// ---------- AI scoring ----------
// waitMin = minutes between the candidate's request and the first request of the group
const makeScoreFn = (model, timeOf, leadT) => (evaluation, routeKm) => {
  const savingPct = estimateSavingPct(evaluation, routeKm, RIDE_TYPE);
  const waitMin = Math.abs((timeOf(evaluation.id) ?? leadT) - leadT);
  return predictProba(model, pairFeatures({ evaluation, savingPct, waitMin }));
};

// ---------- one simulation run ----------
/**
 * mode: "proximity" | "corridor" | "smart"
 * model: trained pairing model (required for "smart")
 * collect: true to return the decision log (features + accepted label) for training
 * acceptSeed: randomness for rider decisions (same seed = same riders' coin flips)
 */
const runSimulation = ({ requests, mode = "corridor", model = null, collect = false, acceptSeed = 7 }) => {
  if (mode === "smart" && !model) throw new Error("smart mode needs a trained model");
  const rand = mulberry32(acceptSeed);
  const byId = new Map(requests.map((r) => [r.id, r]));
  const timeOf = (id) => byId.get(id)?.t;
  const groups = [];
  const log = [];
  const m = { riders: requests.length, offered: 0, accepted: 0, pooledRiders: 0, offeredRiders: 0, vehicleKm: 0, soloKm: 0, savingPct: [], detourKm: [], groups: 0, groupRiders: 0 };
  for (const r of requests) m.soloKm += haversineKm(r.pickup, r.dropoff);

  const windows = new Map();
  for (const r of requests) {
    const w = Math.floor(r.t / WINDOW_MIN);
    if (!windows.has(w)) windows.set(w, []);
    windows.get(w).push(r);
  }

  for (const reqs of windows.values()) {
    const done = new Set();
    for (const lead of reqs) {
      if (done.has(lead.id)) continue;
      done.add(lead.id);
      const cands = reqs.filter((c) => !done.has(c.id));
      const leadKm = haversineKm(lead.pickup, lead.dropoff);

      // 1. Matcher proposes a group
      let spine = lead;
      let route = straightRoute(lead.pickup, lead.dropoff, 12);
      let proposed = []; // evaluations of members on the spine route
      if (mode === "proximity") {
        const res = matchProximity(lead, cands, { capacity: CAPACITY });
        proposed = res.members.map((mm) => evaluateCandidate(route, byId.get(mm.id), { maxOffRouteKm: 99, minOverlapRatio: 0, minSharedKm: 0, maxDetourKm: 99 }));
        proposed.forEach((e, i) => { e.detourKm = res.members[i].detourKm; });
      } else {
        const opts = mode === "smart" ? { score: makeScoreFn(model, timeOf, lead.t), minScore: SMART_MIN_SCORE } : {};
        const res = matchCorridorBestSpine(lead, cands, { capacity: CAPACITY, routeFor: (x) => straightRoute(x.pickup, x.dropoff, 12), opts });
        spine = res.members.length ? byId.get(res.spine.id) : lead;
        route = res.members.length ? res.route : route;
        proposed = res.members;
      }
      if (!proposed.length) { m.vehicleKm += leadKm; groups.push({ spine: lead, route, routeKm: leadKm, members: [] }); continue; }

      // 2. Offer to each proposed member; simulated riders accept or decline
      done.add(spine.id);
      const routeKm = mode === "proximity" ? leadKm : routeLengthKm(route);
      const offered = proposed.map((e) => {
        const rider = byId.get(e.id);
        done.add(e.id);
        const savingPct = mode === "proximity" ? (1 - (SEM7_TIERS[proposed.length + 1] || 0.55)) * 100 : estimateSavingPct(e, routeKm, RIDE_TYPE);
        // waitMin: minutes since the first request of this group (same definition as makeScoreFn)
        const waitMin = Math.abs(rider.t - lead.t);
        const f = { pickupOffKm: e.pickupOffKm, dropOffKm: e.dropOffKm, overlapRatio: e.overlapRatio, detourKm: e.detourKm, savingPct, waitMin, directKm: e.directKm };
        const pTrue = trueAcceptProb(f, rider.tolerance);
        const accepted = rand() < pTrue;
        const pPred = model ? predictProba(model, pairFeatures({ evaluation: e, savingPct, waitMin })) : null;
        if (collect) log.push({ features: f, accepted: accepted ? 1 : 0, mode });
        return { e, rider, f, pTrue, pPred, accepted };
      });
      m.offered += offered.length;
      m.offeredRiders += offered.length + 1;
      const joined = offered.filter((o) => o.accepted);
      m.accepted += joined.length;

      // 3. Realised trip
      if (!joined.length) {
        // nobody accepted: spine rides alone, declined riders ride alone too
        m.vehicleKm += haversineKm(spine.pickup, spine.dropoff);
        offered.forEach((o) => { m.vehicleKm += o.e.directKm; });
      } else {
        const size = joined.length + 1;
        const detour = joined.reduce((s, o) => s + o.e.detourKm, 0);
        m.vehicleKm += routeKm + detour;
        offered.filter((o) => !o.accepted).forEach((o) => { m.vehicleKm += o.e.directKm; });
        m.groups += 1; m.groupRiders += size; m.pooledRiders += size;
        joined.forEach((o) => m.detourKm.push(o.e.detourKm));
        if (mode === "proximity") {
          const mult = SEM7_TIERS[size] || 0.55;
          for (let k = 0; k < size; k++) m.savingPct.push((1 - mult) * 100);
        } else {
          const fares = splitFare({ lead: spine, members: joined.map((o) => o.e), routeKm, rideType: RIDE_TYPE });
          fares.forEach((fr) => m.savingPct.push((100 * fr.saving) / fr.soloFare));
        }
      }
      groups.push({
        spine,
        route,
        routeKm,
        members: offered.map((o) => ({
          id: o.rider.id, pickup: o.rider.pickup, dropoff: o.rider.dropoff,
          accepted: o.accepted, pTrue: o.pTrue, pPred: o.pPred,
          sharedKm: o.e.sharedKm, detourKm: o.e.detourKm, savingPct: o.f.savingPct,
        })),
      });
    }
  }

  const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
  const metrics = {
    riders: m.riders,
    offeredPct: (100 * m.offeredRiders) / m.riders,
    pooledPct: (100 * m.pooledRiders) / m.riders,
    acceptanceRate: m.offered ? (100 * m.accepted) / m.offered : 0,
    ridersPerCar: m.groups ? m.groupRiders / m.groups : 0,
    vehicleKmSavedPct: (100 * (m.soloKm - m.vehicleKm)) / m.soloKm,
    avgSavingPct: avg(m.savingPct),
    avgDetourKm: avg(m.detourKm),
  };
  return { metrics, groups, log };
};

module.exports = {
  ORIGINS, HUBS, WINDOW_MIN, CAPACITY, SMART_MIN_SCORE,
  mulberry32, generateRequests, runSimulation, trueAcceptProb, soloFare,
};
