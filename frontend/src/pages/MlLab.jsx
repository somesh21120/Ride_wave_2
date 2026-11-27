import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FlaskConical, Brain, Shuffle, Users, Gauge, Leaf, IndianRupee, Info, Database, GitMerge, Route, Sparkles, Cpu, Loader } from "lucide-react";
import api from "../services/api";
import ExplainStepper from "../components/mllab/ExplainStepper";

/**
 * ML Lab: a visual, interactive explanation of RideWave's ride pooling.
 * Everything on this page runs on SIMULATED Rajkot commute data (backend/services/simulation.js
 * via /api/lab). It shows the Sem 7 matcher, the Sem 8 route-corridor matcher and the
 * Sem 8 + ML matcher side by side, plus what the ML model learned and the commute corridors
 * it discovered.
 */

const MODES = [
  { id: "proximity", label: "Sem 7: Proximity", short: "Sem 7", color: "#6B7280", desc: "Pools riders only if both pickup and drop-off are within 1.5 km of the first rider's." },
  { id: "corridor", label: "Sem 8: Route corridor", short: "Sem 8", color: "#0F766E", desc: "Pools riders whose trips lie along the same route, with detour limits and a fair per-km fare split." },
  { id: "smart", label: "Sem 8 + ML", short: "Sem 8 + ML", color: "#7C3AED", desc: "Route corridor plus an ML model that predicts which riders will accept a pool and offers those pairs first." },
];
const DEMANDS = [60, 120, 240, 480];
const POOL_COLORS = ["#0F766E", "#2563EB", "#6D5BD0", "#DB2777", "#7C3AED", "#059669", "#DC2626", "#0891B2"];
const RAJKOT = [22.305, 70.795];

const FEATURE_LABELS = {
  savingPct: "Fare saving",
  detourKm: "Detour length",
  overlapRatio: "Share of trip on the route",
  pickupOffKm: "Pickup distance from route",
  dropOffKm: "Drop-off distance from route",
  waitMin: "Waiting time",
  directKm: "Trip length",
};

const STEPS = [
  { Icon: Database, title: "1. Collect requests", text: "Ride requests arriving within the same 2 minutes are considered together." },
  { Icon: Route, title: "2. Corridor check", text: "Each rider's pickup and drop-off are projected onto a route. They qualify if both are near it, in the same direction, and most of their trip is shared." },
  { Icon: GitMerge, title: "3. Spine selection", text: "If a short trip lies inside a longer one, the longer trip becomes the corridor, so more riders fit." },
  { Icon: Brain, title: "4. ML ranking", text: "A model trained on collected decisions predicts who will accept. Likely pairs are offered first, unlikely ones are skipped." },
  { Icon: IndianRupee, title: "5. Fair fare split", text: "Every km is shared by the riders in the car on that km; each rider pays their own detour and saves at least 10%." },
];

// Road geometry for the map. The server accepts at most 60 paths per request,
// so jobs are sent in chunks. Each job has a stable key so results never land on the wrong line.
const MAX_POOLS_ON_ROADS = 15;
const MAX_MEMBERS_PER_POOL = 4;
const fetchRoads = async (jobs) => {
  const out = {};
  for (let i = 0; i < jobs.length; i += 60) {
    const chunk = jobs.slice(i, i + 60);
    try {
      const { data } = await api.post("/lab/road-routes", { paths: chunk.map((j) => j.points) });
      (data.routes || []).forEach((r, k) => { if (r) out[chunk[k].key] = r; });
    } catch {
      /* keep straight lines for this chunk */
    }
  }
  return out;
};

const pct = (v) => (v == null ? "-" : `${Number(v).toFixed(1)}%`);
const toLL = (p) => [p.lat, p.lng];

const Stat = ({ Icon, label, value, hint }) => (
  <div className="rw-card" style={{ padding: "14px 16px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: 600 }}>
      <Icon size={15} /> {label}
    </div>
    <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>{value}</p>
    {hint && <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{hint}</p>}
  </div>
);

const MlLab = () => {
  const [perHour, setPerHour] = useState(240);
  const [seed, setSeed] = useState(1);
  const [mode, setMode] = useState("corridor");
  const [sim, setSim] = useState(null);
  const [compare, setCompare] = useState(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCorridors, setShowCorridors] = useState(false);
  const [showSingles, setShowSingles] = useState(true);
  const [roads, setRoads] = useState({}); // key -> { points, distanceKm, road }
  const [snappingRoads, setSnappingRoads] = useState(false);
  const roadRequest = useRef(0);

  useEffect(() => {
    api.get("/lab/model").then(({ data }) => setModel(data)).catch(() => setModel(null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const requestId = ++roadRequest.current;
    try {
      const [s, c] = await Promise.all([
        api.get("/lab/simulate", { params: { perHour, seed, mode } }),
        api.get("/lab/compare", { params: { perHour, seed } }),
      ]);
      setSim(s.data);
      setCompare(c.data.results);
      setLoading(false);
      // Snap the largest pools and their riders to real roads (straight dashed lines show meanwhile)
      const jobs = [];
      const pools = [...(s.data?.pools || [])].sort((a, b) => b.members.length - a.members.length).slice(0, MAX_POOLS_ON_ROADS);
      for (const p of pools) {
        if (p.spine?.pickup && p.spine?.dropoff) jobs.push({ key: `pool:${p.spineId}`, points: [p.spine.pickup, p.spine.dropoff] });
        for (const m of p.members.slice(0, MAX_MEMBERS_PER_POOL)) {
          if (m.pickup && m.dropoff) jobs.push({ key: `m:${m.id}`, points: [m.pickup, m.dropoff] });
        }
      }
      if (jobs.length) {
        setSnappingRoads(true);
        const found = await fetchRoads(jobs);
        if (requestId === roadRequest.current) setRoads((prev) => ({ ...prev, ...found }));
        if (requestId === roadRequest.current) setSnappingRoads(false);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Could not run the simulation. Is the backend running?");
      setLoading(false);
      setSnappingRoads(false);
    }
  }, [perHour, seed, mode]);

  // Corridors found by k-means also follow roads (fetched once when the model loads)
  useEffect(() => {
    const corridors = model?.corridors || [];
    if (!corridors.length) return;
    fetchRoads(corridors.map((c) => ({ key: `corr:${c.id}`, points: [c.from, c.to] })))
      .then((found) => setRoads((prev) => ({ ...prev, ...found })));
  }, [model]);

  useEffect(() => { load(); }, [load]);

  const pooledIds = useMemo(() => {
    const ids = new Set();
    (sim?.pools || []).forEach((p) => { ids.add(p.spineId); p.members.forEach((m) => { if (m.accepted) ids.add(m.id); }); });
    return ids;
  }, [sim]);

  const activeMode = MODES.find((m) => m.id === mode);
  const maxWeight = Math.max(0.001, ...(model?.importance || []).map((w) => Math.abs(w.weight)));
  const metrics = sim?.metrics;

  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "100%" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <p style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--brand-dark)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <FlaskConical size={15} /> ML Lab
            </p>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>How RideWave matches shared rides</h1>
            <p style={{ color: "var(--text-secondary)", maxWidth: "720px", marginTop: "6px", fontSize: "0.95rem" }}>
              Watch the same morning commute in Rajkot matched three ways: the Sem 7 method, the new route-corridor method, and route corridor with ML ranking.
            </p>
          </div>
          <span className="rw-badge" style={{ background: "var(--brand-light)", color: "var(--brand)", alignSelf: "center" }}>Simulated data</span>
        </div>

        {/* Controls */}
                <ExplainStepper />
        <div className="rw-card" style={{ padding: "14px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px" }}>
          <div className="rw-admin-tabs" role="tablist" aria-label="Matching method" style={{ flex: "1 1 420px" }}>
            {MODES.map((m) => (
              <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => setMode(m.id)}
                className={mode === m.id ? "rw-btn-primary" : "rw-btn-secondary"} style={{ fontSize: "0.85rem" }}
                disabled={m.id === "smart" && !model}
                title={m.id === "smart" && !model ? "Train the model first: npm run train" : m.desc}>
                {m.id === "smart" && <Sparkles size={14} />} {m.label}
              </button>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Demand
            <select className="rw-input" value={perHour} onChange={(e) => setPerHour(Number(e.target.value))} style={{ width: "auto" }} aria-label="Ride requests per hour">
              {DEMANDS.map((d) => <option key={d} value={d}>{d} requests / hour</option>)}
            </select>
          </label>
          <button className="rw-btn-secondary" onClick={() => setSeed((s) => s + 1)} style={{ fontSize: "0.85rem" }}>
            <Shuffle size={15} /> New day ({seed})
          </button>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "14px" }}>
          <strong style={{ color: activeMode.color }}>{activeMode.label}:</strong> {activeMode.desc}
        </p>

        {error && <div className="rw-card" role="alert" style={{ padding: "14px", color: "#B91C1C", marginBottom: "16px" }}>{error}</div>}

        {/* Map + stats */}
        <div className="rw-lab-grid">
          <div className="rw-card" style={{ padding: "10px", minWidth: 0 }}>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text-secondary)", padding: "4px 6px 10px" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: "#059669", marginRight: 5 }} />rider accepted the pool</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: "#DC2626", marginRight: 5 }} />rider declined</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: "#9CA3AF", marginRight: 5 }} />rode alone</span>
              <span>Coloured line = shared route</span>
              {Object.keys(roads).length > 0 && <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", width: "100%" }}>Lines follow real roads (OpenStreetMap + OSRM). Dashed = road route not available.</span>}
              <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                <input type="checkbox" checked={showSingles} onChange={(e) => setShowSingles(e.target.checked)} /> solo riders
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                <input type="checkbox" checked={showCorridors} onChange={(e) => setShowCorridors(e.target.checked)} disabled={!model} /> ML-discovered corridors
              </label>
            </div>
            <div className="rw-lab-map" style={{ borderRadius: "12px", overflow: "hidden", position: "relative" }}>
              {loading && <div style={{ position: "absolute", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.4)", fontWeight: 700 }}>Simulating...</div>}
                          {snappingRoads && <div style={{ position: "absolute", top: 12, right: 12, zIndex: 500, background: "var(--bg-card)", borderRadius: "var(--radius-pill)", padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: "6px" }}><Loader size={14} className="rw-spin" /> Snapping routes to roads...</div>}
              <MapContainer center={RAJKOT} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                {showSingles && (sim?.requests || []).filter((r) => !pooledIds.has(r.id)).map((r) => (
                  <CircleMarker key={r.id} center={toLL(r.pickup)} radius={3} pathOptions={{ color: "#9CA3AF", fillColor: "#9CA3AF", fillOpacity: 0.7, weight: 1 }}>
                    <Tooltip>{r.from} to {r.to} (rode alone)</Tooltip>
                  </CircleMarker>
                ))}
                {(sim?.pools || []).map((p, i) => {
                  const color = POOL_COLORS[i % POOL_COLORS.length];
                  const road = roads[`pool:${p.spineId}`];
                  const isRoad = road?.road === true;
                  const routePoints = isRoad ? road.points.map(toLL) : (p.route || []).map(toLL);
                  const start = isRoad ? routePoints[0] : toLL(p.spine.pickup);
                  const end = isRoad ? routePoints[routePoints.length - 1] : toLL(p.spine.dropoff);
                  return (
                    <Fragment key={p.spineId}>
                      <Polyline positions={routePoints} pathOptions={{ color, weight: 5, opacity: 0.8, dashArray: isRoad ? undefined : "8 6" }}>
                        <Tooltip sticky>Shared route {isRoad ? road.distanceKm.toFixed(1) : p.routeKm} km: {p.spine.from} to {p.spine.to}{isRoad ? "" : " (straight line)"}</Tooltip>
                      </Polyline>
                      <CircleMarker center={start} radius={7} pathOptions={{ color, fillColor: color, fillOpacity: 1, weight: 2 }}>
                        <Tooltip>Main route starts: {p.spine.from}</Tooltip>
                      </CircleMarker>
                      <CircleMarker center={end} radius={7} pathOptions={{ color, fillColor: "#fff", fillOpacity: 1, weight: 3 }}>
                        <Tooltip>Main route ends: {p.spine.to}</Tooltip>
                      </CircleMarker>
                      {p.members.map((m) => {
                        const c = m.accepted ? "#059669" : "#DC2626";
                        const mRoad = roads[`m:${m.id}`];
                        const mIsRoad = mRoad?.road === true;
                        const memberPoints = mIsRoad ? mRoad.points.map(toLL) : [toLL(m.pickup), toLL(m.dropoff)];
                        return (
                          <Fragment key={m.id}>
                            <Polyline positions={memberPoints} pathOptions={{ color: c, weight: 2.5, dashArray: mIsRoad ? undefined : "4 6", opacity: 0.8 }} />
                            <CircleMarker center={memberPoints[0]} radius={5} pathOptions={{ color: c, fillColor: c, fillOpacity: 1, weight: 1 }}>
                              <Popup>
                                <strong>{m.accepted ? "Joined the pool" : "Declined the offer"}</strong><br />
                                Shares {m.sharedKm} km of the route<br />
                                Detour {m.detourKm} km<br />
                                Fare saving {m.savingPct}%
                                {m.predicted != null && (<><br />ML predicted acceptance: {Math.round(m.predicted * 100)}%</>)}
                              </Popup>
                            </CircleMarker>
                            <CircleMarker center={memberPoints[memberPoints.length - 1]} radius={3.5} pathOptions={{ color: c, fillColor: "#fff", fillOpacity: 1, weight: 2 }} />
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  );
                })}
                {showCorridors && (model?.corridors || []).map((c) => {
                  const road = roads[`corr:${c.id}`];
                  const isRoad = road?.road === true;
                  return (
                    <Polyline key={c.id} positions={isRoad ? road.points.map(toLL) : [toLL(c.from), toLL(c.to)]} pathOptions={{ color: "#6D5BD0", weight: Math.max(4, c.share * 40), dashArray: isRoad ? undefined : "10 8", opacity: 0.55 }}>
                      <Tooltip sticky>Corridor: {c.fromName} to {c.toName} ({(c.share * 100).toFixed(1)}% of trips)</Tooltip>
                    </Polyline>
                  );
                })}
              </MapContainer>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", padding: "8px 6px 0" }}>Tap a coloured dot to see why that rider was matched. Lines follow real roads once routes load; dashed lines are straight-line placeholders.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Stat Icon={Users} label="Riders" value={metrics ? metrics.riders : "-"} hint={`${perHour} requests/hour, 30 min`} />
            <Stat Icon={Users} label="Rode shared" value={pct(metrics?.pooledPct)} hint="of all riders" />
            <Stat Icon={Gauge} label="Offers accepted" value={pct(metrics?.acceptanceRate)} hint="pool offers riders said yes to" />
            <Stat Icon={Leaf} label="Car-km saved" value={pct(metrics?.vehicleKmSavedPct)} hint="vs everyone riding alone" />
            <Stat Icon={IndianRupee} label="Avg fare saving" value={pct(metrics?.avgSavingPct)} hint="for riders who shared" />
            <Stat Icon={Route} label="Avg detour" value={metrics ? `${metrics.avgDetourKm} km` : "-"} hint="per added rider" />
          </div>
        </div>

        {/* Comparison */}
        <div className="rw-card" style={{ padding: "18px", marginTop: "16px" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "4px" }}>Same riders, three methods</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "10px" }}>Average of 10 simulated one-hour days at {perHour} requests per hour. A single day is too noisy to compare fairly.</p>
          <div className="rw-table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "8px" }}>Method</th>
                  <th style={{ padding: "8px" }}>Rode shared</th>
                  <th style={{ padding: "8px" }}>Offers accepted</th>
                  <th style={{ padding: "8px" }}>Car-km saved</th>
                  <th style={{ padding: "8px" }}>Avg fare saving</th>
                  <th style={{ padding: "8px" }}>Avg detour</th>
                </tr>
              </thead>
              <tbody>
                {MODES.filter((m) => compare?.[m.id]).map((m) => {
                  const r = compare[m.id];
                  return (
                    <tr key={m.id} style={{ borderTop: "1px solid var(--border)", background: m.id === mode ? "var(--brand-light)" : "transparent" }}>
                      <td style={{ padding: "8px", fontWeight: 700, color: m.color }}>{m.label}</td>
                      <td style={{ padding: "8px" }}>{pct(r.pooledPct)}</td>
                      <td style={{ padding: "8px" }}>{pct(r.acceptanceRate)}</td>
                      <td style={{ padding: "8px" }}>{pct(r.vehicleKmSavedPct)}</td>
                      <td style={{ padding: "8px" }}>{pct(r.avgSavingPct)}</td>
                      <td style={{ padding: "8px" }}>{r.avgDetourKm} km</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "8px" }}>The ML helps most when demand is high and there are several possible partners to choose from; at low demand all three methods have few options.</p>
        </div>

        {/* How it works */}
        <div className="rw-card" style={{ padding: "18px", marginTop: "16px" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "12px" }}>How matching works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {STEPS.map(({ Icon, title, text }) => (
              <div key={title} style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "14px" }}>
                <Icon size={20} color="var(--brand-dark)" />
                <p style={{ fontWeight: 700, color: "var(--text-primary)", marginTop: "8px", fontSize: "0.92rem" }}>{title}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "4px" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ML model card */}
        <div className="rw-card" style={{ padding: "18px", marginTop: "16px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>
            <Brain size={18} color="#7C3AED" /> The ML pairing model
          </h2>
          {!model ? (
            <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Not trained yet. Run <code>npm run train</code> in the backend folder.</p>
          ) : (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "6px", maxWidth: "820px" }}>
                Logistic regression trained on {model.dataset.rows.toLocaleString("en-IN")} collected pool offers from simulated days ({model.dataset.train.toLocaleString("en-IN")} for training, {model.dataset.test.toLocaleString("en-IN")} held back for testing). It predicts how likely a rider is to accept a pool partner.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "12px" }}>
                <Stat Icon={Gauge} label="Test accuracy" value={pct(model.metrics.test.accuracy * 100)} hint={`always guessing "yes": ${pct(model.metrics.test.baseRate * 100)}`} />
                <Stat Icon={Brain} label="Test AUC" value={model.metrics.test.auc.toFixed(2)} hint="0.5 = guessing, 1.0 = perfect" />
                <Stat Icon={Database} label="Decisions collected" value={model.dataset.rows.toLocaleString("en-IN")} hint="simulated" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "16px" }}>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "8px" }}>What the model learned</p>
                  {model.importance.map((w) => (
                    <div key={w.feature} style={{ display: "grid", gridTemplateColumns: "150px 1fr 60px", alignItems: "center", gap: "8px", marginBottom: "6px", fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>{FEATURE_LABELS[w.feature] || w.feature}</span>
                      <div style={{ background: "var(--bg-secondary)", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
                        <div style={{ width: `${(Math.abs(w.weight) / maxWeight) * 100}%`, height: "100%", background: w.weight >= 0 ? "#059669" : "#DC2626" }} />
                      </div>
                      <span style={{ color: w.weight >= 0 ? "#059669" : "#DC2626", fontWeight: 700 }}>{w.weight >= 0 ? "more yes" : "more no"}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "8px" }}>Commute corridors found by clustering (k-means)</p>
                  {(model.corridors || []).slice(0, 8).map((c, i) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: "8px", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--text-primary)" }}>{i + 1}. {c.fromName} to {c.toName}</span>
                      <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{(c.share * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                  <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "6px" }}>Tick "ML-discovered corridors" above the map to draw them.</p>
                </div>
              </div>
            </>
          )}
        </div>

        <p style={{ display: "flex", gap: "8px", alignItems: "flex-start", color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "16px" }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
          All data on this page is simulated: synthetic ride requests, approximate area locations, simulated rider decisions, and straight-line distances inside the matching maths (the map draws real road routes). The live app records real matching decisions so the same pipeline can be retrained on real data.
        </p>
      </div>
    </div>
  );
};

export default MlLab;
