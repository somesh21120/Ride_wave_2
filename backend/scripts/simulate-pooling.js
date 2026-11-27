/**
 * Pooling simulation: proximity matching (Sem 7, v1) vs route-corridor matching (Sem 8, v2).
 *
 * Run from the backend folder:   node scripts/simulate-pooling.js
 * Options:                       node scripts/simulate-pooling.js --seeds 10 --minutes 60
 *
 * What it does
 *   - Generates morning-commute ride requests in Rajkot: from residential areas to
 *     hubs (university, railway station, offices, industrial area), with random
 *     start points within ~1 km of each area and random request times.
 *   - Replays the same requests through both matchers with the live app's rules:
 *     requests are grouped into 2-minute matching windows, the earliest unmatched
 *     request is the lead, car pools hold up to 3 riders.
 *   - Reports, per demand level (requests per hour), averaged over several random seeds:
 *       pooled %        share of riders who ended up in a shared ride
 *       riders/vehicle  average riders in the pooled vehicles
 *       vehicle-km saved versus everyone riding alone
 *       avg saving %    average fare saving of pooled riders
 *       avg detour km   extra driving per added rider
 *   - Writes docs/results/pooling-simulation.md, .csv and .svg (chart for slides/paper).
 *
 * Honest limitations (also printed in the report):
 *   - Area coordinates are approximate and demand is synthetic, not real trip data.
 *   - Routes are straight lines between points, not road routes. The live app can use
 *     OSRM road routes; the simulation does not call any external service.
 *   - Proximity fares use the Sem 7 tiered discount; corridor fares use the segment-wise split.
 */
const fs = require("fs");
const path = require("path");
const {
  haversineKm, straightRoute, matchCorridor, matchCorridorBestSpine, matchProximity, splitFare,
} = require("../services/corridorMatch");

// ---------- settings ----------
const args = process.argv.slice(2);
const argVal = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : def;
};
const SEEDS = argVal("seeds", 10);
const MINUTES = argVal("minutes", 60);
const DEMAND_LEVELS = [30, 60, 120, 240, 480]; // requests per hour
const WINDOW_MIN = 2;      // same 2-minute matching window as the live app
const CAPACITY = 3;        // riders per car pool (4-seater incl. driver)
const RIDE_TYPE = "car";
const JITTER_KM = 1.0;     // start/end points spread around each area
const SEM7_TIERS = { 2: 0.70, 3: 0.55 }; // fare multiplier by pool size (Sem 7)

// Approximate locations in Rajkot (for simulation only)
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

// ---------- helpers ----------
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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

const generateRequests = (rand, perHour) => {
  const n = Math.round((perHour * MINUTES) / 60);
  const reqs = [];
  for (let i = 0; i < n; i++) {
    const o = pickWeighted(rand, ORIGINS);
    let h = pickWeighted(rand, HUBS);
    const pickup = jitter(rand, o);
    const dropoff = jitter(rand, h);
    if (haversineKm(pickup, dropoff) < 1.5) { i--; continue; } // skip trivial trips
    reqs.push({ id: `r${i}`, t: rand() * MINUTES, pickup, dropoff });
  }
  return reqs.sort((a, b) => a.t - b.t);
};

// ---------- one run ----------
const runMatcher = (requests, mode) => {
  const out = { riders: requests.length, pooledRiders: 0, groups: 0, groupRiders: 0, vehicleKm: 0, soloKm: 0, savingPct: [], detourKm: [] };
  for (const r of requests) out.soloKm += haversineKm(r.pickup, r.dropoff);

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

      if (mode === "proximity") {
        const res = matchProximity(lead, cands, { capacity: CAPACITY });
        if (!res.members.length) { out.vehicleKm += leadKm; continue; }
        const size = res.members.length + 1;
        const mult = SEM7_TIERS[size] || 0.55;
        res.members.forEach((m) => { done.add(m.id); out.detourKm.push(m.detourKm); });
        // vehicle drives the lead's trip plus the extra distance between nearby stops
        out.vehicleKm += leadKm + res.totalDetourKm;
        out.groups += 1; out.groupRiders += size; out.pooledRiders += size;
        for (let k = 0; k < size; k++) out.savingPct.push((1 - mult) * 100);
      } else {
        const res = mode === "corridor-no-spine"
          ? { ...matchCorridor(lead, cands, { capacity: CAPACITY, route: straightRoute(lead.pickup, lead.dropoff, 12) }), spine: lead }
          : matchCorridorBestSpine(lead, cands, { capacity: CAPACITY, routeFor: (x) => straightRoute(x.pickup, x.dropoff, 12) });
        if (!res.members.length) { out.vehicleKm += leadKm; continue; }
        const size = res.members.length + 1;
        // The spine rider (lead or a longer trip) rides the whole route; members join along it
        done.add(res.spine.id);
        res.members.forEach((m) => { done.add(m.id); out.detourKm.push(m.detourKm); });
        out.vehicleKm += res.routeKm + res.totalDetourKm;
        out.groups += 1; out.groupRiders += size; out.pooledRiders += size;
        const fares = splitFare({ lead: res.spine, members: res.members, routeKm: res.routeKm, rideType: RIDE_TYPE });
        fares.forEach((f) => out.savingPct.push((f.saving / f.soloFare) * 100));
      }
    }
  }
  return out;
};

const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

const summarize = (runs) => ({
  pooledPct: avg(runs.map((r) => (100 * r.pooledRiders) / r.riders)),
  ridersPerVehicle: avg(runs.filter((r) => r.groups).map((r) => r.groupRiders / r.groups)),
  vkmSavedPct: avg(runs.map((r) => (100 * (r.soloKm - r.vehicleKm)) / r.soloKm)),
  savingPct: avg(runs.map((r) => avg(r.savingPct))),
  detourKm: avg(runs.map((r) => avg(r.detourKm))),
});

// ---------- chart ----------
const svgChart = (rows) => {
  const W = 640, H = 360, L = 60, R = 20, T = 40, Bm = 50;
  const xs = rows.map((r) => r.demand);
  const maxY = Math.max(10, ...rows.flatMap((r) => [r.proximity.pooledPct, r.corridor.pooledPct])) * 1.1;
  const x = (i) => L + (i * (W - L - R)) / (xs.length - 1);
  const y = (v) => T + (H - T - Bm) * (1 - v / maxY);
  const line = (key, color) => rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r[key].pooledPct).toFixed(1)}`).join(" ");
  const dots = (key, color) => rows.map((r, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(r[key].pooledPct).toFixed(1)}" r="4" fill="${color}"/>`).join("");
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = maxY * f;
    return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e5e7eb"/><text x="${L - 8}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="#6b7280">${v.toFixed(0)}%</text>`;
  }).join("");
  const labels = xs.map((d, i) => `<text x="${x(i)}" y="${H - Bm + 18}" font-size="11" text-anchor="middle" fill="#6b7280">${d}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, Arial, sans-serif">
<rect width="100%" height="100%" fill="#ffffff"/>
<text x="${L}" y="22" font-size="15" font-weight="700" fill="#111827">Riders pooled vs demand (simulated Rajkot morning commute)</text>
${grid}
<path d="${line("proximity")}" fill="none" stroke="#9ca3af" stroke-width="2.5"/>${dots("proximity", "#9ca3af")}
<path d="${line("corridor")}" fill="none" stroke="#0f766e" stroke-width="2.5"/>${dots("corridor", "#0f766e")}
${labels}
<text x="${(L + W - R) / 2}" y="${H - 12}" font-size="12" text-anchor="middle" fill="#374151">Ride requests per hour</text>
<rect x="${W - R - 210}" y="${T}" width="12" height="3" fill="#9ca3af"/><text x="${W - R - 192}" y="${T + 5}" font-size="12" fill="#374151">Proximity (Sem 7)</text>
<rect x="${W - R - 210}" y="${T + 18}" width="12" height="3" fill="#0f766e"/><text x="${W - R - 192}" y="${T + 23}" font-size="12" fill="#374151">Route corridor (Sem 8)</text>
</svg>
`;
};

// ---------- main ----------
const rows = DEMAND_LEVELS.map((demand) => {
  const prox = [];
  const corr = [];
  const basic = [];
  for (let s = 1; s <= SEEDS; s++) {
    const reqs = generateRequests(mulberry32(demand * 1000 + s), demand);
    prox.push(runMatcher(reqs, "proximity"));
    corr.push(runMatcher(reqs, "corridor"));
    basic.push(runMatcher(reqs, "corridor-no-spine"));
  }
  return { demand, proximity: summarize(prox), corridor: summarize(corr), basic: summarize(basic) };
});

const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);
let md = `# Pooling simulation: proximity (Sem 7) vs route corridor (Sem 8)

Generated by \`backend/scripts/simulate-pooling.js\` on ${new Date().toISOString().slice(0, 10)}.
Setup: ${MINUTES} minute morning commute in Rajkot, ${SEEDS} random seeds per demand level, ${WINDOW_MIN} minute matching window, car pools of up to ${CAPACITY} riders.

| Requests / hour | Pooled riders % (v1 / v2) | Riders per pooled car (v1 / v2) | Vehicle-km saved % (v1 / v2) | Avg fare saving % (v1 / v2) | Avg detour km per added rider (v1 / v2) |
|---|---|---|---|---|---|
`;
let csv = "requests_per_hour,matcher,pooled_pct,riders_per_vehicle,vehicle_km_saved_pct,avg_saving_pct,avg_detour_km\n";
for (const r of rows) {
  const p = r.proximity, c = r.corridor;
  md += `| ${r.demand} | ${f1(p.pooledPct)} / **${f1(c.pooledPct)}** | ${f2(p.ridersPerVehicle)} / ${f2(c.ridersPerVehicle)} | ${f1(p.vkmSavedPct)} / **${f1(c.vkmSavedPct)}** | ${f1(p.savingPct)} / ${f1(c.savingPct)} | ${f2(p.detourKm)} / ${f2(c.detourKm)} |\n`;
  csv += `${r.demand},proximity,${f2(p.pooledPct)},${f2(p.ridersPerVehicle)},${f2(p.vkmSavedPct)},${f2(p.savingPct)},${f2(p.detourKm)}\n`;
  csv += `${r.demand},corridor,${f2(c.pooledPct)},${f2(c.ridersPerVehicle)},${f2(c.vkmSavedPct)},${f2(c.savingPct)},${f2(c.detourKm)}\n`;
}
md += `
### Ablation: what each part of v2 contributes (pooled riders %)

| Requests / hour | v1 proximity | v2 corridor, first request's route only | v2 corridor + spine selection |
|---|---|---|---|
`;
for (const r of rows) md += `| ${r.demand} | ${f1(r.proximity.pooledPct)} | ${f1(r.basic.pooledPct)} | ${f1(r.corridor.pooledPct)} |\n`;
md += `
Reading the ablation: the corridor rules alone are stricter than v1 for riders whose stops are near each other but not along the first rider's route, so they pool slightly fewer riders. The gain of v2 comes from combining corridor rules with spine selection (letting a longer trip that contains the first rider's trip act as the corridor).

v1 = proximity matching (pickup and drop-off within 1.5 km of the first rider's), v2 = route-corridor matching.

## Limitations
- Demand is synthetic and area coordinates are approximate; this is not real trip data.
- Routes are straight lines between points, not road routes. Road routes (OSRM) are used by the live app when available.
- Proximity fares use the Sem 7 tiered discount (30% off for 2 riders, 45% off for 3). Corridor fares use the segment-wise split with at least 10% saving per rider, so fare savings are not directly comparable; pooled % and vehicle-km saved are the fair comparison.
- Next steps: real road routes, rider waiting time, sensitivity to the detour and overlap limits.
`;

const outDir = path.join(__dirname, "..", "..", "docs", "results");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "pooling-simulation.md"), md);
fs.writeFileSync(path.join(outDir, "pooling-simulation.csv"), csv);
fs.writeFileSync(path.join(outDir, "pooling-simulation.svg"), svgChart(rows));
console.log(md);
console.log(`Saved to ${outDir}`);
