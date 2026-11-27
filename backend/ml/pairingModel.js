/**
 * Loads the trained pairing model (ml/pairing-model.json, created by
 * `npm run train`). Returns null if the model has not been trained yet, so callers
 * can fall back to plain corridor matching.
 */
const fs = require("fs");
const path = require("path");

const MODEL_PATH = path.join(__dirname, "pairing-model.json");
let cached;

const loadModel = () => {
  if (cached !== undefined) return cached;
  try {
    cached = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"));
  } catch {
    cached = null;
  }
  return cached;
};

const reloadModel = () => { cached = undefined; return loadModel(); };

module.exports = { MODEL_PATH, loadModel, reloadModel };
