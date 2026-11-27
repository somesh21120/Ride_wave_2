/**
 * Features for the intelligent ride pairing model. Computed the same way in the
 * simulation (to build the training dataset) and in the live app (to score pairs).
 * All values are available at decision time, before the pool is offered.
 */
const FEATURES = [
  "pickupOffKm",     // how far the candidate's pickup is from the route
  "dropOffKm",       // how far the drop-off is from the route
  "overlapRatio",    // share of the candidate's trip that is shared
  "detourKm",        // extra km the car drives for this candidate
  "savingPct",       // candidate's estimated fare saving, %
  "waitMin",         // minutes between the two requests (time the earlier rider waits)
  "directKm",        // candidate's own trip length
];

const pairFeatures = ({ evaluation, savingPct, waitMin }) => [
  evaluation.pickupOffKm,
  evaluation.dropOffKm,
  evaluation.overlapRatio,
  evaluation.detourKm,
  savingPct,
  waitMin,
  evaluation.directKm,
];

module.exports = { FEATURES, pairFeatures };
