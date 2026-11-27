/**
 * Logistic regression, written from scratch (no ML library), used by the
 * intelligent ride pairing model.
 *
 *   p(accept) = sigmoid(b + w1*x1 + ... + wn*xn)   on standardized features
 *
 * Training: batch gradient descent on log loss with L2 regularization.
 * The exported model is plain JSON (feature names, means, std devs, weights), so the
 * live app can load it without any dependency and the weights can be shown on the
 * Pooling Lab page ("what the model learned").
 */
const sigmoid = (z) => 1 / (1 + Math.exp(-z));

const standardize = (X) => {
  const n = X.length;
  const d = X[0].length;
  const mean = new Array(d).fill(0);
  const std = new Array(d).fill(0);
  for (const row of X) row.forEach((v, j) => { mean[j] += v / n; });
  for (const row of X) row.forEach((v, j) => { std[j] += ((v - mean[j]) ** 2) / n; });
  for (let j = 0; j < d; j++) std[j] = Math.sqrt(std[j]) || 1;
  return { mean, std };
};

/** X: array of feature arrays, y: array of 0/1. Returns a model object. */
const train = (X, y, { features, epochs = 400, lr = 0.5, l2 = 0.001 } = {}) => {
  if (!X.length) throw new Error("No training data");
  const { mean, std } = standardize(X);
  const Z = X.map((row) => row.map((v, j) => (v - mean[j]) / std[j]));
  const d = Z[0].length;
  let w = new Array(d).fill(0);
  let b = 0;
  const n = Z.length;
  for (let e = 0; e < epochs; e++) {
    const gw = new Array(d).fill(0);
    let gb = 0;
    for (let i = 0; i < n; i++) {
      let z = b;
      for (let j = 0; j < d; j++) z += w[j] * Z[i][j];
      const err = sigmoid(z) - y[i];
      for (let j = 0; j < d; j++) gw[j] += err * Z[i][j];
      gb += err;
    }
    w = w.map((wj, j) => wj - lr * (gw[j] / n + l2 * wj));
    b -= lr * (gb / n);
  }
  return {
    type: "logistic-regression",
    features: features || Array.from({ length: d }, (_, j) => `x${j}`),
    mean,
    std,
    weights: w,
    bias: b,
  };
};

const predictProba = (model, x) => {
  let z = model.bias;
  for (let j = 0; j < model.weights.length; j++) z += model.weights[j] * ((x[j] - model.mean[j]) / model.std[j]);
  return sigmoid(z);
};

/** Area under the ROC curve (probability a random positive scores above a random negative). */
const auc = (scores, labels) => {
  const pairs = scores.map((s, i) => [s, labels[i]]).sort((a, b) => a[0] - b[0]);
  let rankSum = 0;
  let pos = 0;
  let i = 0;
  while (i < pairs.length) {
    let j = i;
    while (j + 1 < pairs.length && pairs[j + 1][0] === pairs[i][0]) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) if (pairs[k][1] === 1) { rankSum += avgRank; pos++; }
    i = j + 1;
  }
  const neg = pairs.length - pos;
  if (!pos || !neg) return 0.5;
  return (rankSum - (pos * (pos + 1)) / 2) / (pos * neg);
};

const evaluate = (model, X, y) => {
  const p = X.map((x) => predictProba(model, x));
  const acc = p.reduce((s, pi, i) => s + ((pi >= 0.5 ? 1 : 0) === y[i] ? 1 : 0), 0) / y.length;
  const logLoss = -p.reduce((s, pi, i) => {
    const q = Math.min(1 - 1e-9, Math.max(1e-9, pi));
    return s + (y[i] ? Math.log(q) : Math.log(1 - q));
  }, 0) / y.length;
  const baseRate = y.reduce((s, v) => s + v, 0) / y.length;
  return { n: y.length, accuracy: acc, auc: auc(p, y), logLoss, baseRate };
};

module.exports = { sigmoid, train, predictProba, evaluate, auc };
