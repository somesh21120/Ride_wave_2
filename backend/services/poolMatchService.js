const crypto = require("crypto");
const Ride = require("../models/Ride");
const { notifyRide } = require("./realtime");
const config = require("../config");
const { matchCorridorBestSpine, splitFare, explainMatch, estimateSavingPct } = require("./corridorMatch");
const { getRoute } = require("./routing");
const { loadModel } = require("../ml/pairingModel");
const { pairFeatures } = require("../ml/features");
const { predictProba } = require("../ml/logistic");

const SMART_MIN_SCORE = 0.35;

// Data collection: store every candidate evaluation (never blocks matching)
const logDecisions = async (res, matcher, lead, docsById) => {
  try {
    const MatchLog = require("../models/MatchLog");
    const chosen = new Set(res.members.map((m) => m.id));
    const evals = [...res.members, ...(res.rejected || [])].filter((e) => e && e.id && docsById.has(e.id));
    if (!evals.length) return;
    const leadT = lead.poolMatchRequestedAt ? lead.poolMatchRequestedAt.getTime() : Date.now();
    await MatchLog.insertMany(evals.map((e) => {
      const doc = docsById.get(e.id);
      const t = doc.poolMatchRequestedAt ? doc.poolMatchRequestedAt.getTime() : leadT;
      return {
        ride: res.spine ? res.spine.id : String(lead._id),
        candidate: e.id,
        matcher,
        features: {
          pickupOffKm: e.pickupOffKm, dropOffKm: e.dropOffKm, overlapRatio: e.overlapRatio, detourKm: e.detourKm,
          savingPct: e.ok ? estimateSavingPct(e, res.routeKm) : null, waitMin: Math.abs(t - leadT) / 60000, directKm: e.directKm,
        },
        eligible: !!e.ok,
        reason: e.reason || null,
        predicted: e.score ?? null,
        chosen: chosen.has(e.id),
      };
    }), { ordered: false });
  } catch (err) {
    console.warn("[PoolMatch] Could not write MatchLog:", err.message);
  }
};

const RATES = {
  bike: { base: 20, per: 8 }, auto: { base: 30, per: 12 }, car: { base: 50, per: 18 },
};
const POOL_DISCOUNT = 0.7;
const MATCH_MAX_DIST_KM = 1.5;
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const CHECK_INTERVAL_MS = 15 * 1000; // 15 seconds

// Progressive pool discounts — bigger savings with more riders
const POOL_DISCOUNT_TIERS = { 2: 0.70, 3: 0.55, 4: 0.50, 5: 0.45, 6: 0.40 };
const getPoolDiscount = (poolSize) => POOL_DISCOUNT_TIERS[poolSize] || 0.40;

const getDistance = (p, d) => {
  const dLat = ((d.lat - p.lat) * Math.PI) / 180;
  const dLon = ((d.lng - p.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p.lat * Math.PI) / 180) *
      Math.cos((d.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calcFare = (distance, rideType, isPool = false) => {
  const r = RATES[rideType] || RATES.car;
  const fare = r.base + r.per * distance;
  return Math.round(isPool ? fare * POOL_DISCOUNT : fare);
};

/** Revert a single unmatched ride to solo (full fare). */
const revertToSolo = async (ride) => {
  const fullFare = calcFare(ride.distance, ride.rideType, false);
  ride.fare = fullFare;
  ride.poolSavings = 0;
  ride.poolMatchStatus = "reverted_to_solo";
  ride.rideCategory = "standard";
  ride.poolType = null;
  ride.seatsTotal = 1;
  ride.seatsAvailable = 0;
  ride.poolMaxPassengers = 1;
  await ride.save();
  notifyRide(ride, "pool_solo");
  console.log(`[PoolMatch] ${ride.rideType} Ride ${ride._id} reverted to solo, full fare ₹${fullFare}`);
};

/**
 * Close a pool with the given members. The first member (lead) is the dispatched ride;
 * all subsequent members are absorbed as co-riders (status → cancelled).
 * Each rider's fare is set at the progressive discount for the pool size.
 */
const closePool = async (members, lead) => {
  const poolSize = members.length;
  const disc = getPoolDiscount(poolSize);
  const rideType = lead.rideType;

  lead.seatsTotal = poolSize;
  lead.seatsAvailable = 0;
  lead.poolMatchStatus = "matched";
  lead.poolMatchedRide = lead._id;
  lead.poolMaxPassengers = poolSize;
  lead.coRiders = [];

  const leadFull = calcFare(lead.distance, rideType, false);
  lead.fare = Math.round(leadFull * disc);
  lead.poolSavings = leadFull - lead.fare;
  lead.poolMatcher = "proximity";
  lead.poolMatchNote = `Pickup and drop-off within 1.5 km of ${poolSize - 1} other rider(s), saves ₹${lead.poolSavings}`;

  for (let k = 1; k < members.length; k++) {
    const m = members[k];
    const mFull = calcFare(m.distance, rideType, false);
    const mFare = Math.round(mFull * disc);

    lead.coRiders.push({
      user: m.passenger,
      pickupLocation: m.pickupLocation,
      fare: mFare,
    });

    // Absorb the co-rider's ride into the lead
    m.fare = mFare;
    m.poolSavings = mFull - mFare;
    m.poolMatcher = "proximity";
    m.poolMatchNote = `Pickup and drop-off within 1.5 km of another rider's, saves ₹${m.poolSavings}`;
    m.poolMatchStatus = "matched";
    m.poolMatchedRide = lead._id;
    m.rideCategory = "pool";
    m.poolType = "carpool";
    m.seatsTotal = poolSize;
    m.seatsAvailable = 0;
    m.status = "cancelled";
    m.cancelledBy = "system";
    await m.save();
    notifyRide(m, "pool_absorbed");
  }

  await lead.save();
  notifyRide(lead, "pool_matched");

  const fares = [lead, ...members.slice(1)].map((m) => `₹${m.fare}`);
  console.log(
    `[PoolMatch] Matched ${poolSize}-rider ${rideType} pool → lead ${lead._id}, ` +
    `co-riders: ${members.slice(1).map((m) => m._id).join(", ")}, ` +
    `fares: ${fares.join(", ")}, discount: ${Math.round((1 - disc) * 100)}% off each`
  );
};

// ---------- v2: route-corridor pools (POOL_MATCHER=corridor) ----------

const toRider = (r) => ({ id: String(r._id), pickup: r.pickupLocation, dropoff: r.dropoffLocation });

/**
 * Close a corridor pool. The spine ride (whose route is the corridor) is dispatched;
 * every other member, including the original lead if it is not the spine, is absorbed
 * as a co-rider. Fares come from the segment-wise split (each rider saves at least 10%).
 */
const closeCorridorPool = async (res, docsById, rideType, matcher = "corridor") => {
  const spine = docsById.get(res.spine.id);
  const memberDocs = res.members.map((m) => docsById.get(m.id));
  const size = memberDocs.length + 1;
  const soloKm = Object.fromEntries([spine, ...memberDocs].map((d) => [String(d._id), d.distance]));
  const fares = splitFare({ lead: { id: String(spine._id) }, members: res.members, routeKm: res.routeKm, rideType, soloKm });
  const fareById = Object.fromEntries(fares.map((f) => [f.id, f]));

  const sf = fareById[String(spine._id)];
  spine.fare = sf.fare;
  spine.poolSavings = sf.saving;
  spine.seatsTotal = size;
  spine.seatsAvailable = 0;
  spine.poolMatchStatus = "matched";
  spine.poolMatchedRide = spine._id;
  spine.poolMaxPassengers = size;
  spine.rideCategory = "pool";
  spine.poolMatcher = matcher;
  spine.poolMatchNote = `Your route is the main route; ${size - 1} rider(s) join along the way, saves ₹${sf.saving}`;
  spine.coRiders = [];

  const newStartOtp = () => String(crypto.randomInt(1000, 10000));

  for (let k = 0; k < memberDocs.length; k++) {
    const m = memberDocs[k];
    const ev = res.members[k];
    const f = fareById[String(m._id)];
    const coOtp = newStartOtp();
    spine.coRiders.push({
      user: m.passenger,
      pickupLocation: m.pickupLocation,
      dropoffLocation: m.dropoffLocation,
      fare: f.fare,
      sharedKm: Number(ev.sharedKm.toFixed(2)),
      detourKm: Number(ev.detourKm.toFixed(2)),
      otp: coOtp,
    });
    m.fare = f.fare;
    m.poolSavings = f.saving;
    m.poolMatchStatus = "matched";
    m.poolMatchedRide = spine._id;
    m.rideCategory = "pool";
    m.poolType = "carpool";
    m.seatsTotal = size;
    m.seatsAvailable = 0;
    m.poolMatcher = matcher;
    m.poolMatchNote = explainMatch({ sharedKm: ev.sharedKm, detourKm: ev.detourKm, saving: f.saving });
    m.status = "cancelled";
    m.cancelledBy = "system";
    await m.save();
    notifyRide(m, "pool_absorbed");
  }
  await spine.save();
  notifyRide(spine, "pool_matched");
  console.log(`[PoolMatch:${matcher}] ${size}-rider ${rideType} pool, spine ${spine._id}, route ${res.routeKm.toFixed(1)} km, detour ${res.totalDetourKm.toFixed(1)} km, fares ${fares.map((x) => "₹" + x.fare).join(", ")}`);
};

/** One corridor matching step for a lead. Returns the ids that were pooled or reverted. */
const corridorStep = async (lead, candDocs, maxPax, leadExpired, matcher = "corridor") => {
  const docsById = new Map([lead, ...candDocs].map((d) => [String(d._id), d]));
  // Road routes for the lead and the longest candidates (possible corridors), fetched once
  const routes = new Map();
  const spineCands = [lead, ...[...candDocs].sort((a, b) => (b.distance || 0) - (a.distance || 0)).slice(0, 6)];
  for (const d of spineCands) {
    const { route } = await getRoute(d.pickupLocation, d.dropoffLocation);
    routes.set(String(d._id), route);
  }
  // Smart mode: rank candidates by the AI model's predicted acceptance
  const opts = {};
  const model = matcher === "smart" ? loadModel() : null;
  if (model) {
    const leadT = lead.poolMatchRequestedAt ? lead.poolMatchRequestedAt.getTime() : Date.now();
    opts.score = (evaluation, routeKm) => {
      const doc = docsById.get(evaluation.id);
      const t = doc && doc.poolMatchRequestedAt ? doc.poolMatchRequestedAt.getTime() : leadT;
      const savingPct = estimateSavingPct(evaluation, routeKm, lead.rideType);
      return predictProba(model, pairFeatures({ evaluation, savingPct, waitMin: Math.abs(t - leadT) / 60000 }));
    };
    opts.minScore = SMART_MIN_SCORE;
  }
  const res = matchCorridorBestSpine(toRider(lead), candDocs.map(toRider), {
    capacity: maxPax,
    routeFor: (x) => routes.get(x.id),
    opts,
  });
  if (res.members.length === 0) {
    if (leadExpired) { await revertToSolo(lead); return [String(lead._id)]; }
    return [];
  }
  if (res.members.length + 1 >= maxPax || leadExpired) {
    const used = model ? "smart" : "corridor";
    await logDecisions(res, used, lead, docsById);
    await closeCorridorPool(res, docsById, lead.rideType, used);
    return [res.spine.id, ...res.members.map((m) => m.id)];
  }
  return []; // partial pool, still inside the 2 minute window: wait for more riders
};

/**
 * Core matching logic — runs every 15 seconds.
 *
 * Works per vehicle type (auto / car):
 * - Auto pools: caps at 3 passengers.
 * - Car pools: caps at the lead ride's poolMaxPassengers (default 3, corresponds
 *   to a 4-seater where the driver takes one seat).
 *
 * Flow per cohort (riders near each other's pickup AND dropoff within 1.5km):
 * 1. Take the earliest waiting ride as the lead.
 * 2. Scan newer rides for proximity matches; accumulate into the lead up to the cap.
 * 3a. If cap is reached → close the pool (all matched, lead dispatched).
 * 3b. If the lead's 2-minute cooldown expires with ≥1 match → close partial pool.
 * 3c. If the lead's cooldown expires with 0 matches → revert to solo (full fare).
 * 4. Any remaining unmatched & expired rides → solo revert.
 */
let running = false;

const checkPoolMatches = async () => {
  // Road-route lookups can take a few seconds; never let two rounds overlap
  if (running) return;
  running = true;
  try {
    const waiting = await Ride.find({
      rideCategory: "pool",
      poolMatchStatus: "waiting_for_match",
      rideType: { $in: ["car", "auto"] },
    }).sort({ poolMatchRequestedAt: 1 });

    if (waiting.length === 0) return;

    // Group by vehicle type
    const byType = {};
    for (const r of waiting) {
      if (!byType[r.rideType]) byType[r.rideType] = [];
      byType[r.rideType].push(r);
    }

    const matchedIds = new Set();
    const now = Date.now();

    for (const [rideType, group] of Object.entries(byType)) {
      // Auto always caps at 3; car uses the ride's poolMaxPassengers (default 3)
      const isAuto = rideType === "auto";
      const getCap = (lead) => (isAuto ? 3 : lead.poolMaxPassengers || 3);

      for (let i = 0; i < group.length; i++) {
        if (matchedIds.has(String(group[i]._id))) continue;
        const lead = group[i];
        const maxPax = getCap(lead);
        if (maxPax < 2) continue; // degenerate, skip

        if (config.poolMatcher === "corridor" || config.poolMatcher === "smart") {
          const candDocs = group.slice(i + 1).filter((c) => !matchedIds.has(String(c._id)));
          const expired = lead.poolMatchRequestedAt && (now - lead.poolMatchRequestedAt.getTime() >= COOLDOWN_MS);
          const done = await corridorStep(lead, candDocs, maxPax, expired, config.poolMatcher);
          done.forEach((id) => matchedIds.add(id));
          continue;
        }

        // Accumulate proximity matches into the lead's pool
        const poolMembers = [lead];
        for (let j = i + 1; j < group.length && poolMembers.length < maxPax; j++) {
          const cand = group[j];
          if (matchedIds.has(String(cand._id))) continue;

          // Both pickleup AND dropoff must be within 1.5 km of the LEAD's locations
          const pDist = getDistance(lead.pickupLocation, cand.pickupLocation);
          if (pDist > MATCH_MAX_DIST_KM) continue;
          const dDist = getDistance(lead.dropoffLocation, cand.dropoffLocation);
          if (dDist > MATCH_MAX_DIST_KM) continue;

          poolMembers.push(cand);
        }

        const coRiderCount = poolMembers.length - 1;
        const leadExpired = lead.poolMatchRequestedAt && (now - lead.poolMatchRequestedAt.getTime() >= COOLDOWN_MS);

        if (coRiderCount === 0 && leadExpired) {
          // No matches found and lead has timed out → solo
          await revertToSolo(lead);
          matchedIds.add(String(lead._id));
        } else if (coRiderCount >= 1 && (poolMembers.length >= maxPax || leadExpired)) {
          // Pool is full OR cooldown expired with at least one match → close the pool
          await closePool(poolMembers, lead);
          for (const m of poolMembers) matchedIds.add(String(m._id));
        }
        // Otherwise: partial pool still has time → wait for next cycle
      }
    }

    // Revert any unmatched rides that have exceeded the 2-minute window
    for (const r of waiting) {
      if (matchedIds.has(String(r._id))) continue;
      if (r.poolMatchRequestedAt && now - r.poolMatchRequestedAt.getTime() >= COOLDOWN_MS) {
        await revertToSolo(r);
        matchedIds.add(String(r._id));
      }
    }
  } catch (e) {
    console.error("[PoolMatch] Error:", e.message);
  } finally {
    running = false;
  }
};

let intervalHandle = null;

const startPoolMatcher = () => {
  if (intervalHandle) return;
  console.log(`[PoolMatch] Starting pool matcher (every 15s, mode: ${config.poolMatcher})`);
  intervalHandle = setInterval(checkPoolMatches, CHECK_INTERVAL_MS);
};

const stopPoolMatcher = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};

module.exports = { startPoolMatcher, stopPoolMatcher, checkPoolMatches, getDistance, calcFare, corridorStep, closeCorridorPool };