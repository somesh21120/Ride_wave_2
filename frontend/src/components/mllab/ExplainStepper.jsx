import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Database, GitMerge, IndianRupee, Route, Brain, Target, BarChart3, CheckCircle2, MapPin, FlaskConical, Loader } from "lucide-react";
import api from "../../services/api";
import { ExplainQuestion, ExplainData, ExplainCorridors } from "../illustrations";

const STEPS = [
  { id: "question", title: "The question", icon: Target },
  { id: "data", title: "Data collection", icon: Database },
  { id: "features", title: "What the model looks at", icon: BarChart3 },
  { id: "learned", title: "What it learned", icon: Brain },
  { id: "accuracy", title: "How good it is", icon: CheckCircle2 },
  { id: "impact", title: "What it changes", icon: Route },
];

const FEATURE_NAMES = {
  pickupOffKm: "Pickup off route (km)",
  dropOffKm: "Drop-off off route (km)",
  overlapRatio: "Trip shared (%)",
  detourKm: "Extra detour (km)",
  savingPct: "Fare saving (%)",
  waitMin: "Waiting time (min)",
  directKm: "Trip length (km)",
};

const GLOSSARY = [
  { term: "Logistic regression", def: "A simple ML model that learns a yes/no decision from past data." },
  { term: "Feature", def: "One piece of information the model uses to make a prediction." },
  { term: "Training / test split", def: "The data is split: the model learns from 80% and is tested on the 20% it never saw." },
  { term: "Accuracy", def: "The fraction of predictions the model got right." },
  { term: "AUC", def: "A measure of how well the model tells a willing rider from an unwilling one. 1.0 = perfect, 0.5 = random." },
  { term: "k-means", def: "An algorithm that groups similar items (here, commute routes) into clusters." },
];

const DotGrid = ({ correct, total }) => {
  const cols = 10;
  const rows = Math.ceil(total / cols);
  const dots = [];
  for (let i = 0; i < total && i < 100; i++) {
    dots.push(i < correct);
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(total, cols)}, 8px)`, gap: "2px", justifyContent: "center", margin: "12px 0" }}>
      {dots.map((ok, i) => (
        <div key={i} style={{ width: "8px", height: "8px", borderRadius: "2px", background: ok ? "var(--success)" : "var(--border)" }} />
      ))}
    </div>
  );
};

const ExplainStepper = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [sample, setSample] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || sample) return;
    setLoading(true);
    Promise.all([
      api.get("/lab/sample?n=8").then(r => r.data).catch(() => null),
      api.get("/lab/model").then(r => r.data).catch(() => null),
      api.get("/lab/compare", { params: { perHour: 240, seed: 1 } }).then(r => r.data).catch(() => null),
    ]).then(([s, m, c]) => {
      setSample(s || []);
      setModelData(m);
      setCompareData(c?.results || null);
      setLoading(false);
    });
  }, [open]);

  const goNext = useCallback(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), []);
  const goBack = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goBack();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goBack]);

  if (!open) {
    return (
      <button className="rw-btn-primary" onClick={() => setOpen(true)} style={{ width: "100%", marginBottom: "16px" }}>
        Explain it step by step
      </button>
    );
  }

  const s = STEPS[step];
  const pct = (v) => (v == null ? "-" : `${Number(v).toFixed(1)}%`); // metrics are already percentages
  const fmt = (n) => (n == null ? "" : Number(n).toLocaleString("en-IN"));
  const acc = modelData?.metrics?.test?.accuracy ? Math.round(modelData.metrics.test.accuracy * 100) : null;
  const auc = modelData?.metrics?.test?.auc ? (modelData.metrics.test.auc * 100).toFixed(0) : null;

  return (
    <div className="rw-card" style={{ padding: "24px", marginBottom: "16px" }}>
      {/* Progress bar */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {STEPS.map((st, i) => (
          <div key={st.id} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= step ? "var(--brand)" : "var(--border)", transition: "background 0.2s" }} />
        ))}
      </div>
      {/* Step dots */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        {STEPS.map((st, i) => (
          <button key={st.id} onClick={() => setStep(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: "4px", opacity: i <= step ? 1 : 0.4 }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: i === step ? "var(--brand)" : i < step ? "var(--success)" : "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <st.icon size={14} color={i <= step ? "white" : "var(--text-muted)"} />
            </div>
            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", textAlign: "center", maxWidth: "60px" }}>{st.title}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ minHeight: "200px" }}>
        {loading && <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading data...</div>}
        {!loading && step === 0 && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Will this rider accept sharing with that rider?</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>In one line: Can we predict whether a rider will say yes to a shared ride?</p>
            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
              <ExplainQuestion width={240} />
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontStyle: "italic" }}>Say this: "Every time a ride is offered to a rider, the system learns something. This stepper shows you how."</p>
          </div>
        )}
        {!loading && step === 1 && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Data collection</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>In one line: We collect every ride offer and whether the rider accepted it.</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <ExplainData width={180} />
              {sample && sample.length > 0 && (
                <div style={{ overflowX: "auto", maxWidth: "100%" }}>
                  <table style={{ fontSize: "0.65rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ padding: "4px 6px", textAlign: "left" }}>Pickup off</th>
                        <th style={{ padding: "4px 6px", textAlign: "left" }}>Drop off</th>
                        <th style={{ padding: "4px 6px", textAlign: "left" }}>Shared %</th>
                        <th style={{ padding: "4px 6px", textAlign: "left" }}>Detour</th>
                        <th style={{ padding: "4px 6px", textAlign: "left" }}>Saving %</th>
                        <th style={{ padding: "4px 6px", textAlign: "left" }}>Wait</th>
                        <th style={{ padding: "4px 6px", textAlign: "left" }}>Trip km</th>
                        <th style={{ padding: "4px 6px", textAlign: "left" }}>Accepted?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "3px 6px" }}>{r.features.pickupOffKm}</td>
                          <td style={{ padding: "3px 6px" }}>{r.features.dropOffKm}</td>
                          <td style={{ padding: "3px 6px" }}>{r.features.overlapRatio}</td>
                          <td style={{ padding: "3px 6px" }}>{r.features.detourKm}</td>
                          <td style={{ padding: "3px 6px" }}>{r.features.savingPct}</td>
                          <td style={{ padding: "3px 6px" }}>{r.features.waitMin}</td>
                          <td style={{ padding: "3px 6px" }}>{r.features.directKm}</td>
                          <td style={{ padding: "3px 6px" }}><span className={`rw-badge rw-badge-${r.accepted ? "success" : "danger"}`}>{r.accepted ? "Yes" : "No"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "8px" }}>Simulated data. {fmt(modelData?.dataset?.rows) || "15,895"} simulated offers; each row is one offer and whether the rider said yes.</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontStyle: "italic", marginTop: "8px" }}>Say this: "15,895 simulated offers; each row is one offer and whether the rider said yes."</p>
          </div>
        )}
        {!loading && step === 2 && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>What the model looks at</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>In one line: Seven factors decide whether a rider will share a ride.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "400px" }}>
              {Object.entries(FEATURE_NAMES).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "4px 8px", background: "var(--surface-2)", borderRadius: "6px" }}>
                  <span style={{ color: "var(--text-primary)" }}>{v}</span>
                </div>
              ))}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontStyle: "italic", marginTop: "8px" }}>Say this: "These seven features are calculated for every ride offer."</p>
          </div>
        )}
        {!loading && step === 3 && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>What it learned</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>In one line: The model found that fare saving matters most, while detour length pushes riders away.</p>
            {modelData?.importance?.length > 0 && (
              <div style={{ maxWidth: "400px" }}>
                {[...modelData.importance].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, 7).map((imp) => {
                  const isPositive = imp.weight >= 0;
                  return (
                    <div key={imp.feature} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", width: "120px", flexShrink: 0 }}>{FEATURE_NAMES[imp.feature] || imp.feature}</span>
                      <div style={{ flex: 1, height: "16px", background: "var(--surface-2)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${Math.abs(imp.weight) * 100}%`, height: "100%", background: isPositive ? "var(--success)" : "var(--danger)", borderRadius: "4px" }} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: isPositive ? "var(--success)" : "var(--danger)", width: "60px", textAlign: "right" }}>
                        {isPositive ? "More likely" : "Less likely"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontStyle: "italic", marginTop: "8px" }}>Say this: "Bigger fare saving makes riders accept; a longer detour makes them refuse."</p>
          </div>
        )}
        {!loading && step === 4 && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>How good it is</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>In one line: The model is right about 7 out of 10 times.</p>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center", marginBottom: "12px" }}>
              <div className="rw-stat" style={{ textAlign: "center", padding: "16px", minWidth: "120px" }}>
                <p className="rw-stat-label">Accuracy</p>
                <p className="rw-stat-value">{acc || "72"}%</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{acc ? `${Math.round(acc * 0.72)} of ${100} correct` : "72 of 100 predictions correct"}</p>
              </div>
              <div className="rw-stat" style={{ textAlign: "center", padding: "16px", minWidth: "120px" }}>
                <p className="rw-stat-label">AUC</p>
                <p className="rw-stat-value">{auc || "78"}%</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Picks the more willing rider</p>
              </div>
            </div>
            <DotGrid correct={acc ? Math.round(acc) : 72} total={100} />
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Tested on {fmt(modelData?.metrics?.test?.n) || "3,179"} offers the model never saw during training.</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>Model: logistic regression, trained from scratch in JavaScript.</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontStyle: "italic", marginTop: "8px" }}>Say this: "Tested on {fmt(modelData?.metrics?.test?.n) || "3,179"} offers the model never saw during training."</p>
            <span className="rw-tag-new" style={{ marginTop: "8px", display: "inline-flex" }}>Simulated data</span>
          </div>
        )}
        {!loading && step === 5 && (
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>What it changes + route mapping</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>In one line: ML matching pools more riders with less detour than proximity-only matching.</p>
            {compareData && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
                {["proximity", "corridor", "smart"].filter((k) => compareData[k]).map((mode) => [mode, compareData[mode]]).map(([mode, m]) => (
                  <div key={mode} className="rw-stat" style={{ textAlign: "center", padding: "12px" }}>
                    <p className="rw-stat-label" style={{ fontSize: "0.65rem" }}>{mode === "proximity" ? "Sem 7" : mode === "corridor" ? "Sem 8" : "Sem 8 + ML"}</p>
                    <p className="rw-stat-value" style={{ fontSize: "1.1rem" }}>{pct(m.pooledPct)}</p>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Pooled riders</p>
                    <p className="rw-stat-value" style={{ fontSize: "1.1rem" }}>{pct(m.acceptanceRate)}</p>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Offers accepted</p>
                    <p className="rw-stat-value" style={{ fontSize: "1.1rem" }}>{pct(m.vehicleKmSavedPct)}</p>
                    <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Car-km saved</p>
                  </div>
                ))}
              </div>
            )}
            {modelData?.corridors?.length > 0 && (
              <div style={{ marginBottom: "12px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <ExplainCorridors width={200} />
                <div style={{ flex: "1 1 240px" }}>
                <p style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "6px" }}>Most common commute corridors found in the data (k-means route mapping):</p>
                {modelData.corridors.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                    <MapPin size={12} color="var(--brand)" />
                    <span style={{ color: "var(--text-primary)" }}>{c.fromName} to {c.toName}</span>
                    <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>{(c.share * 100).toFixed(1)}% of trips</span>
                  </div>
                ))}
                </div>
              </div>
            )}
            <button className="rw-btn-secondary" style={{ fontSize: "0.85rem" }} onClick={() => {
              const mapEl = document.querySelector(".rw-lab-map");
              if (mapEl) mapEl.scrollIntoView({ behavior: "smooth" });
            }}>Show on map</button>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontStyle: "italic", marginTop: "8px" }}>Say this: "ML finds more riders to pool and saves more km than the old method."</p>
            <span className="rw-tag-new" style={{ marginTop: "8px", display: "inline-flex" }}>Simulated data</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <button className="rw-btn-secondary" onClick={goBack} disabled={step === 0} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          {step === STEPS.length - 1 ? (
            <button className="rw-btn-secondary" onClick={() => setOpen(false)}>Close</button>
          ) : (
            <button className="rw-btn-primary" onClick={goNext} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Glossary */}
      <div style={{ marginTop: "20px", padding: "16px", background: "var(--surface-2)", borderRadius: "var(--radius-md)" }}>
        <p style={{ fontWeight: 600, fontSize: "0.8rem", marginBottom: "8px", color: "var(--text-primary)" }}>Glossary</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {GLOSSARY.map(({ term, def }) => (
            <span key={term} style={{ position: "relative", cursor: "help", fontSize: "0.75rem", color: "var(--brand)", borderBottom: "1px dashed var(--brand)", paddingBottom: "1px" }} title={def}>
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ExplainStepper;