/**
 * AI pipeline on simulated data: data collection -> training -> evaluation -> deployment.
 *
 * Run from the backend folder:  npm run train
 *
 * 1. Data collection: runs the simulation (Sem 7 and Sem 8 matchers, many random days and
 *    demand levels) and logs every pool offer with its features and whether the simulated
 *    rider accepted it. Saved to docs/results/pairing-dataset.csv.
 * 2. Training: logistic regression (ml/logistic.js), 80% of the data.
 * 3. Evaluation: accuracy, AUC and log loss on the 20% held out, plus pooling results on
 *    completely new simulated days for Sem 7, Sem 8 and Sem 8 + AI.
 * 4. Route mapping: k-means clustering of trips to discover commute corridors.
 * 5. Deployment: writes ml/pairing-model.json, which the live app uses with POOL_MATCHER=smart.
 *
 * All data is synthetic. The point is to prove the pipeline works end to end; the same
 * code can be retrained on real logged decisions (MatchLog collection) later.
 */
const fs = require("fs");
const path = require("path");
const { generateRequests, runSimulation, mulberry32 } = require("../services/simulation");
const { FEATURES } = require("../ml/features");
const { train, evaluate } = require("../ml/logistic");
const { discoverCorridors } = require("../ml/kmeans");
const { MODEL_PATH } = require("../ml/pairingModel");

const RESULTS = path.join(__dirname, "..", "..", "docs", "results");
fs.mkdirSync(RESULTS, { recursive: true });
const f2 = (v) => v.toFixed(2);
const f1 = (v) => v.toFixed(1);

// ---------- 1. data collection ----------
console.log("1/5 Collecting simulated decision data...");
const rows = [];
for (const perHour of [60, 120, 240, 480]) {
  for (let seed = 1; seed <= 40; seed++) {
    const requests = generateRequests({ seed: perHour * 100 + seed, perHour });
    for (const mode of ["proximity", "corridor"]) {
      const { log } = runSimulation({ requests, mode, collect: true, acceptSeed: seed * 31 + perHour });
      rows.push(...log);
    }
  }
}
const csv = [FEATURES.concat(["accepted", "matcher"]).join(",")]
  .concat(rows.map((r) => FEATURES.map((k) => r.features[k].toFixed(4)).concat([r.accepted, r.mode]).join(",")))
  .join("\n");
fs.writeFileSync(path.join(RESULTS, "pairing-dataset.csv"), csv + "\n");
console.log(`   ${rows.length} decisions collected`);

// ---------- 2. training ----------
console.log("2/5 Training logistic regression...");
const rand = mulberry32(2026);
const shuffled = rows.map((r) => [rand(), r]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const cut = Math.floor(shuffled.length * 0.8);
const toX = (rs) => rs.map((r) => FEATURES.map((k) => r.features[k]));
const toY = (rs) => rs.map((r) => r.accepted);
const trainRows = shuffled.slice(0, cut);
const testRows = shuffled.slice(cut);
const model = train(toX(trainRows), toY(trainRows), { features: FEATURES });

// ---------- 3. evaluation ----------
console.log("3/5 Evaluating...");
const trainEval = evaluate(model, toX(trainRows), toY(trainRows));
const testEval = evaluate(model, toX(testRows), toY(testRows));

// Pooling on new days the model never saw
const modes = ["proximity", "corridor", "smart"];
const levels = [60, 120, 240, 480];
const poolRows = levels.map((perHour) => {
  const acc = Object.fromEntries(modes.map((m) => [m, []]));
  for (let seed = 1001; seed <= 1010; seed++) {
    const requests = generateRequests({ seed: perHour * 100 + seed, perHour });
    for (const mode of modes) acc[mode].push(runSimulation({ requests, mode, model, acceptSeed: seed }).metrics);
  }
  const mean = (list, k) => list.reduce((s, x) => s + x[k], 0) / list.length;
  return { perHour, ...Object.fromEntries(modes.map((m) => [m, {
    offeredPct: mean(acc[m], "offeredPct"), pooledPct: mean(acc[m], "pooledPct"),
    acceptanceRate: mean(acc[m], "acceptanceRate"), vehicleKmSavedPct: mean(acc[m], "vehicleKmSavedPct"),
    avgSavingPct: mean(acc[m], "avgSavingPct"), avgDetourKm: mean(acc[m], "avgDetourKm"),
  }])) };
});

// ---------- 4. route mapping ----------
console.log("4/5 Discovering commute corridors (k-means)...");
const trips = [];
for (let seed = 1; seed <= 10; seed++) trips.push(...generateRequests({ seed: 9000 + seed, perHour: 240 }));
const { corridors } = discoverCorridors(trips, 8, { rand: mulberry32(42) });
const nearest = (p, list) => list.reduce((b, x) => {
  const d = (x.lat - p.lat) ** 2 + (x.lng - p.lng) ** 2;
  return d < b.d ? { d, name: x.name } : b;
}, { d: Infinity, name: "" }).name;
const { ORIGINS, HUBS } = require("../services/simulation");
const namedCorridors = corridors.map((c) => ({ ...c, fromName: nearest(c.from, ORIGINS), toName: nearest(c.to, HUBS) }));

// ---------- 5. deployment ----------
console.log("5/5 Saving model and reports...");
const weights = FEATURES.map((name, j) => ({ feature: name, weight: Number(model.weights[j].toFixed(4)) }))
  .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
const out = {
  ...model,
  version: 1,
  createdAt: new Date().toISOString(),
  trainedOn: "simulated data (scripts/train-pairing-model.js)",
  dataset: { rows: rows.length, train: trainRows.length, test: testRows.length },
  metrics: { train: trainEval, test: testEval },
  importance: weights,
  corridors: namedCorridors,
  pooling: poolRows,
};
fs.writeFileSync(MODEL_PATH, JSON.stringify(out, null, 2));

let md = `# AI pairing model and route mapping (simulated data)

Generated by \`backend/scripts/train-pairing-model.js\` on ${new Date().toISOString().slice(0, 10)}. All data is synthetic.

## Pipeline
1. **Data collection:** ${rows.length} pool offers logged from simulated Rajkot morning commutes (Sem 7 and Sem 8 matchers, 4 demand levels x 40 days), each with ${FEATURES.length} features and whether the rider accepted. Dataset: \`pairing-dataset.csv\`.
2. **Model:** logistic regression trained from scratch (\`ml/logistic.js\`) on 80% (${trainRows.length} rows), tested on the other 20% (${testRows.length} rows).
3. **Use:** the smart matcher ranks candidates by predicted acceptance and does not offer pairs below ${require("../services/simulation").SMART_MIN_SCORE}.

## Model quality (held-out test set)
| Metric | Train | Test |
|---|---|---|
| Accuracy | ${f1(trainEval.accuracy * 100)}% | ${f1(testEval.accuracy * 100)}% |
| AUC | ${f2(trainEval.auc)} | ${f2(testEval.auc)} |
| Log loss | ${f2(trainEval.logLoss)} | ${f2(testEval.logLoss)} |
| Acceptance base rate | ${f1(trainEval.baseRate * 100)}% | ${f1(testEval.baseRate * 100)}% |

Accuracy cannot reach 100%: each simulated rider also has a hidden personal tolerance the model never sees, like real people.

## What the model learned (standardized weights, largest first)
| Feature | Weight | Effect on acceptance |
|---|---|---|
${weights.map((w) => `| ${w.feature} | ${w.weight} | ${w.weight > 0 ? "raises" : "lowers"} |`).join("\n")}

## Pooling on new simulated days (10 days per level, never used for training)
| Requests / hour | Riders pooled %: Sem 7 / Sem 8 / Sem 8 + AI | Offer acceptance %: Sem 7 / Sem 8 / Sem 8 + AI | Vehicle-km saved %: Sem 7 / Sem 8 / Sem 8 + AI |
|---|---|---|---|
${poolRows.map((r) => `| ${r.perHour} | ${f1(r.proximity.pooledPct)} / ${f1(r.corridor.pooledPct)} / **${f1(r.smart.pooledPct)}** | ${f1(r.proximity.acceptanceRate)} / ${f1(r.corridor.acceptanceRate)} / **${f1(r.smart.acceptanceRate)}** | ${f1(r.proximity.vehicleKmSavedPct)} / ${f1(r.corridor.vehicleKmSavedPct)} / **${f1(r.smart.vehicleKmSavedPct)}** |`).join("\n")}

## Route mapping: commute corridors discovered by k-means (k = 8, ${trips.length} trips)
| # | From (nearest area) | To (nearest hub) | Share of trips |
|---|---|---|---|
${namedCorridors.map((c, i) => `| ${i + 1} | ${c.fromName} | ${c.toName} | ${f1(c.share * 100)}% |`).join("\n")}

## Limitations
- Rider behaviour is simulated by a hidden formula plus random personal tolerance; real riders will differ. The live app logs real match decisions (MatchLog) so the same pipeline can be retrained on real data.
- Straight-line routes; approximate area locations.
`;
fs.writeFileSync(path.join(RESULTS, "ai-pairing-model.md"), md);
console.log(md);
console.log(`Model saved to ${MODEL_PATH}`);
