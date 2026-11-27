/**
 * Road routes for corridor matching.
 * Uses the public OSRM server (same as the frontend map) with a short timeout, and falls
 * back to a straight line if routing is off, slow or unavailable, so matching never blocks.
 *
 * Env:
 *   ROUTING=osrm (default) | off
 *   OSRM_URL=https://router.project-osrm.org (default)
 */
const fs = require("fs");
const path = require("path");
const { straightRoute } = require("./corridorMatch");

const OSRM_URL = (process.env.OSRM_URL || "https://router.project-osrm.org").replace(/\/$/, "");
const TIMEOUT_MS = 3000;
const cache = new Map();
const MAX_CACHE = 500;
const CACHE_FILE = path.join(__dirname, "..", ".cache", "osrm-routes.json");
const CACHE_MAX_ENTRIES = 5000;
let saveTimer = null;

// Load persistent cache on startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    for (const [k, v] of Object.entries(raw)) cache.set(k, v);
  }
} catch { /* corrupt file, start fresh */ }

function saveCache() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const obj = {};
      let i = 0;
      for (const [k, v] of cache) {
        obj[k] = v;
        if (++i >= CACHE_MAX_ENTRIES) break;
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), "utf-8");
    } catch { /* best-effort */ }
  }, 5000);
  if (saveTimer.unref) saveTimer.unref(); // never keep the process (or a test run) alive
}

/**
 * Build a cache key from an ordered array of {lat,lng} points.
 * Points are rounded to 5 decimals and joined with ";".
 */
function cacheKey(points) {
  return points.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");
}

const key = (a, b) => `${a.lat.toFixed(5)},${a.lng.toFixed(5)};${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;

/** Returns { route, source: "osrm" | "straight" }. Never throws. */
const getRoute = async (pickup, dropoff) => {
  const k = key(pickup, dropoff);
  if (cache.has(k)) return cache.get(k);
  let result = { route: straightRoute(pickup, dropoff), source: "straight" };
  if (process.env.ROUTING !== "off" && typeof fetch === "function") {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const url = `${OSRM_URL}/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=simplified&geometries=geojson`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (res.ok) {
        const data = await res.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
          result = { route: coords.map(([lng, lat]) => ({ lat, lng })), source: "osrm" };
        }
      }
    } catch {
      // timeout or network error: keep the straight-line fallback
    } finally {
      clearTimeout(timer);
    }
  }
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(k, result);
  saveCache();
  return result;
};

/**
 * Get a road route through 2 to 6 waypoints.
 * Returns { points: [{lat,lng}...], distanceKm, road: true }
 * or straight-line fallback with road: false.
 */
async function getRouteVia(waypoints) {
  const k = cacheKey(waypoints);
  if (cache.has(k)) {
    const cached = cache.get(k);
    return { points: cached.route, distanceKm: cached.distanceKm || 0, road: cached.source === "osrm" };
  }

  let result = { points: straightRoute(waypoints[0], waypoints[waypoints.length - 1]), distanceKm: 0, road: false };

  if (process.env.ROUTING !== "off" && typeof fetch === "function") {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const coords = waypoints.map(p => `${p.lng},${p.lat}`).join(";");
      const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (res.ok) {
        const data = await res.json();
        const r = data?.routes?.[0];
        const pts = r?.geometry?.coordinates;
        if (Array.isArray(pts) && pts.length >= 2) {
          result = {
            points: pts.map(([lng, lat]) => ({ lat, lng })),
            distanceKm: (r.distance || 0) / 1000,
            road: true,
          };
        }
      }
    } catch { /* fallback */ }
    finally { clearTimeout(timer); }
  }

  // Only real road routes are cached; a failed lookup (offline, timeout) is retried next time
  if (result.road) {
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(k, { route: result.points, source: "osrm", distanceKm: result.distanceKm });
    saveCache();
  }
  return result;
}

module.exports = { getRoute, getRouteVia, cacheKey };
