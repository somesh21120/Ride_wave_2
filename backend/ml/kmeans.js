/**
 * k-means clustering (k-means++ start, seeded) for route mapping:
 * every trip is a point (pickup lat, pickup lng, drop-off lat, drop-off lng); trips in the
 * same cluster start in the same area and end in the same area, so each cluster is a
 * commute corridor. Used to discover corridors from (simulated) trip data and, later,
 * to suggest commute groups.
 */
const dist2 = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

const kmeans = (points, k, { rand = Math.random, iterations = 50 } = {}) => {
  if (points.length < k) k = points.length;
  // k-means++ initialisation
  const centroids = [points[Math.floor(rand() * points.length)].slice()];
  while (centroids.length < k) {
    const d = points.map((p) => Math.min(...centroids.map((c) => dist2(p, c))));
    const total = d.reduce((s, v) => s + v, 0);
    let r = rand() * total;
    let idx = 0;
    for (; idx < d.length - 1; idx++) { r -= d[idx]; if (r <= 0) break; }
    centroids.push(points[idx].slice());
  }
  let assign = new Array(points.length).fill(0);
  for (let it = 0; it < iterations; it++) {
    let changed = false;
    assign = points.map((p, i) => {
      let best = 0;
      let bd = Infinity;
      centroids.forEach((c, j) => { const dd = dist2(p, c); if (dd < bd) { bd = dd; best = j; } });
      if (best !== assign[i]) changed = true;
      return best;
    });
    for (let j = 0; j < k; j++) {
      const members = points.filter((_, i) => assign[i] === j);
      if (!members.length) continue;
      centroids[j] = centroids[j].map((_, dIdx) => members.reduce((s, m) => s + m[dIdx], 0) / members.length);
    }
    if (!changed && it > 0) break;
  }
  const inertia = points.reduce((s, p, i) => s + dist2(p, centroids[assign[i]]), 0);
  return { centroids, assign, inertia, k };
};

/**
 * Discover commute corridors from trips [{ pickup, dropoff }].
 * Returns corridors sorted by number of trips: { from, to, trips, share }.
 */
const discoverCorridors = (trips, k = 8, opts = {}) => {
  const pts = trips.map((t) => [t.pickup.lat, t.pickup.lng, t.dropoff.lat, t.dropoff.lng]);
  const res = kmeans(pts, k, opts);
  const counts = new Array(res.k).fill(0);
  res.assign.forEach((a) => { counts[a] += 1; });
  return {
    corridors: res.centroids
      .map((c, j) => ({ id: j, from: { lat: c[0], lng: c[1] }, to: { lat: c[2], lng: c[3] }, trips: counts[j], share: counts[j] / trips.length }))
      .filter((c) => c.trips > 0)
      .sort((a, b) => b.trips - a.trips),
    assign: res.assign,
    inertia: res.inertia,
  };
};

module.exports = { kmeans, discoverCorridors };
