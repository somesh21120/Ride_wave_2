// ML building blocks and the simulation engine. Run with: npm test
const test = require("node:test");
const assert = require("node:assert");
const { train, predictProba, evaluate, auc } = require("../ml/logistic");
const { kmeans, discoverCorridors } = require("../ml/kmeans");
const { generateRequests, runSimulation, mulberry32 } = require("../services/simulation");

test("logistic regression learns the direction of each feature", () => {
  const rand = mulberry32(1);
  const X = [];
  const y = [];
  for (let i = 0; i < 2000; i++) {
    const a = rand() * 4 - 2;
    const b = rand() * 4 - 2;
    const p = 1 / (1 + Math.exp(-(2 * a - 1.5 * b)));
    X.push([a, b]);
    y.push(rand() < p ? 1 : 0);
  }
  const m = train(X, y, { features: ["a", "b"] });
  assert.ok(m.weights[0] > 0.5, `a weight ${m.weights[0]}`);
  assert.ok(m.weights[1] < -0.5, `b weight ${m.weights[1]}`);
  const ev = evaluate(m, X, y);
  assert.ok(ev.auc > 0.8 && ev.accuracy > 0.7);
  assert.ok(predictProba(m, [2, -2]) > 0.9 && predictProba(m, [-2, 2]) < 0.1);
});

test("AUC: perfect, inverted and random rankings", () => {
  assert.strictEqual(auc([0.1, 0.2, 0.8, 0.9], [0, 0, 1, 1]), 1);
  assert.strictEqual(auc([0.9, 0.8, 0.2, 0.1], [0, 0, 1, 1]), 0);
  assert.strictEqual(auc([0.5, 0.5, 0.5, 0.5], [0, 1, 0, 1]), 0.5);
});

test("k-means separates two obvious groups", () => {
  const pts = [[0, 0], [0.1, 0], [0, 0.1], [10, 10], [10.1, 10], [10, 10.1]];
  const r = kmeans(pts, 2, { rand: mulberry32(3) });
  assert.strictEqual(r.assign[0], r.assign[1]);
  assert.strictEqual(r.assign[3], r.assign[4]);
  assert.notStrictEqual(r.assign[0], r.assign[3]);
});

test("corridor discovery returns corridors covering all trips", () => {
  const trips = generateRequests({ seed: 5, perHour: 240 });
  const { corridors } = discoverCorridors(trips, 5, { rand: mulberry32(9) });
  const total = corridors.reduce((s, c) => s + c.trips, 0);
  assert.strictEqual(total, trips.length);
});

test("simulation is reproducible and Sem 8 pools more riders than Sem 7", () => {
  const reqs = generateRequests({ seed: 11, perHour: 240 });
  const a = runSimulation({ requests: reqs, mode: "corridor", acceptSeed: 3 }).metrics;
  const b = runSimulation({ requests: reqs, mode: "corridor", acceptSeed: 3 }).metrics;
  assert.deepStrictEqual(a, b);
  let prox = 0;
  let corr = 0;
  for (let s = 1; s <= 5; s++) {
    const r = generateRequests({ seed: 500 + s, perHour: 240 });
    prox += runSimulation({ requests: r, mode: "proximity", acceptSeed: s }).metrics.pooledPct;
    corr += runSimulation({ requests: r, mode: "corridor", acceptSeed: s }).metrics.pooledPct;
  }
  assert.ok(corr > prox, `corridor ${corr} vs proximity ${prox}`);
});

test("smart mode needs a model", () => {
  const reqs = generateRequests({ seed: 1, perHour: 60 });
  assert.throws(() => runSimulation({ requests: reqs, mode: "smart" }), /needs a trained model/);
});
