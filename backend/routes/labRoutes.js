/**
 * Pooling Lab API: runs the simulation (synthetic data only) for the /lab page.
 * Public and read-only; nothing is stored. Inputs are clamped to keep it fast.
 *
 * GET /api/lab/simulate?perHour=120&seed=1&mode=corridor   requests, pools and metrics for one run
 * GET /api/lab/compare?perHour=120&seed=1                  Sem 7 vs Sem 8 vs Sem 8 + AI, averaged over
 *                                                          10 simulated one-hour days (one day is too noisy)
 * GET /api/lab/model                                       ML model card: quality, weights, corridors
 */
const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const { generateRequests, runSimulation } = require("../services/simulation");
const { loadModel } = require("../ml/pairingModel");
const { getRouteVia } = require("../services/routing");
const { pairFeatures } = require("../ml/features");
const { predictProba } = require("../ml/logistic");

const router = express.Router();
router.use(protect, admin);
const MODES = ["proximity", "corridor", "smart"];

const params = (q) => ({
  perHour: Math.min(480, Math.max(30, Number(q.perHour) || 120)),
  seed: Math.min(100000, Math.max(1, Math.floor(Number(q.seed) || 1))),
  minutes: Math.min(60, Math.max(10, Number(q.minutes) || 30)),
});

const round = (v, d = 5) => Number(v.toFixed(d));
const pt = (p) => ({ lat: round(p.lat), lng: round(p.lng) });
const roundMetrics = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, round(v, 2)]));

router.get("/simulate", (req, res) => {
  const { perHour, seed, minutes } = params(req.query);
  const mode = MODES.includes(req.query.mode) ? req.query.mode : "corridor";
  const model = loadModel();
  if (mode === "smart" && !model) return res.status(409).json({ message: "AI model not trained yet. Run: cd backend && npm run train" });
  const requests = generateRequests({ seed, perHour, minutes });
  const { metrics, groups } = runSimulation({ requests, mode, model, acceptSeed: seed });
  res.json({
    mode, perHour, seed, minutes,
    metrics: roundMetrics(metrics),
    requests: requests.map((r) => ({ id: r.id, t: round(r.t, 2), pickup: pt(r.pickup), dropoff: pt(r.dropoff), from: r.from, to: r.to })),
    pools: groups.filter((g) => g.members.length).map((g) => ({
      spineId: g.spine.id,
      route: g.route.filter((_, i) => i % 3 === 0 || i === g.route.length - 1).map(pt),
      routeKm: round(g.routeKm, 2),
      spine: { pickup: pt(g.spine.pickup), dropoff: pt(g.spine.dropoff), from: g.spine.from, to: g.spine.to },
      members: g.members.map((m) => ({
        id: m.id, pickup: pt(m.pickup), dropoff: pt(m.dropoff), accepted: m.accepted, sharedKm: round(m.sharedKm, 2), detourKm: round(m.detourKm, 2),
        savingPct: round(m.savingPct, 1), predicted: m.pPred == null ? null : round(m.pPred, 3),
      })),
    })),
  });
});

const COMPARE_DAYS = 10;
const COMPARE_MINUTES = 60;

router.get("/compare", (req, res) => {
  const { perHour, seed } = params(req.query);
  const model = loadModel();
  const modes = MODES.filter((m) => m !== "smart" || model);
  const sums = Object.fromEntries(modes.map((m) => [m, {}]));
  for (let d = 0; d < COMPARE_DAYS; d++) {
    const daySeed = seed * 1000 + d;
    const requests = generateRequests({ seed: daySeed, perHour, minutes: COMPARE_MINUTES });
    for (const mode of modes) {
      const m = runSimulation({ requests, mode, model, acceptSeed: daySeed }).metrics;
      for (const [k, v] of Object.entries(m)) sums[mode][k] = (sums[mode][k] || 0) + v / COMPARE_DAYS;
    }
  }
  const results = Object.fromEntries(modes.map((m) => [m, roundMetrics(sums[m])]));
  res.json({ perHour, seed, days: COMPARE_DAYS, minutes: COMPARE_MINUTES, results });
});

router.get("/model", (req, res) => {
  const model = loadModel();
  if (!model) return res.status(404).json({ message: "ML model not trained yet. Run: cd backend && npm run train" });
  const { createdAt, trainedOn, dataset, metrics, importance, corridors, pooling, features, type } = model;
  res.json({ type, features, createdAt, trainedOn, dataset, metrics, importance, corridors, pooling });
});

// ---- Road routes for the ML Lab map ----
router.post("/road-routes", async (req, res) => {
  try {
    const { paths } = req.body;
    if (!Array.isArray(paths) || paths.length > 60) return res.status(400).json({ message: "paths must be an array of up to 60 paths" });
    for (const p of paths) {
      if (!Array.isArray(p) || p.length < 2 || p.length > 6) return res.status(400).json({ message: "Each path must have 2 to 6 points" });
      for (const pt of p) {
        if (typeof pt.lat !== "number" || typeof pt.lng !== "number") return res.status(400).json({ message: "Each point must have lat and lng numbers" });
      }
    }
    // Resolve with concurrency 4
    const results = [];
    const queue = paths.map((p, i) => ({ p, i }));
    const workers = Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const { p, i } = queue.shift();
        results[i] = await getRouteVia(p);
      }
    });
    await Promise.all(workers);
    res.json({ routes: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---- Sample data for the explain stepper ----
router.get("/sample", (req, res) => {
  try {
    const n = Math.min(Math.max(parseInt(req.query.n) || 8, 1), 20);
    const { generateRequests, runSimulation } = require("../services/simulation");
    const model = loadModel();
    const requests = generateRequests({ seed: 11, perHour: 120, minutes: 20 });
    const { groups } = runSimulation({ requests, mode: "corridor", model, acceptSeed: 11, collect: true });
    const rows = [];
    for (const g of groups) {
      for (const m of g.members || []) {
        if (rows.length >= n) break;
        if (m.features) {
          rows.push({
            features: {
              pickupOffKm: Math.round(m.features.pickupOffKm * 100) / 100,
              dropOffKm: Math.round(m.features.dropOffKm * 100) / 100,
              overlapRatio: Math.round(m.features.overlapRatio * 100) / 100,
              detourKm: Math.round(m.features.detourKm * 100) / 100,
              savingPct: Math.round(m.features.savingPct * 100) / 100,
              waitMin: Math.round(m.features.waitMin * 100) / 100,
              directKm: Math.round(m.features.directKm * 100) / 100,
            },
            accepted: m.accepted ? 1 : 0,
            predicted: m.pPred == null ? null : Math.round(m.pPred * 1000) / 1000,
          });
        }
      }
      if (rows.length >= n) break;
    }
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
