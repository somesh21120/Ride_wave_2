import { Users, IndianRupee, Route } from "lucide-react";

/** Pool details on the live trip screen: why the rider was matched, shared km, saving, co-riders. */
const PoolCard = ({ poolMatchNote, sharedKm, savingRs, coRiders }) => {
  if (!poolMatchNote && !sharedKm && !coRiders) return null;
  return (
    <div className="rw-fade-up" style={{ background: "var(--ai-light)", border: "1px solid color-mix(in srgb, var(--ai) 25%, transparent)", borderRadius: "var(--radius-md)", padding: "12px 14px", marginBottom: "14px" }}>
      <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Users size={15} color="var(--ai)" /> Shared ride: why you were matched
      </p>
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "8px" }}>{poolMatchNote || "Your trip runs along the same route as another rider."}</p>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.8rem" }}>
        {sharedKm ? <span style={{ color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: 4 }}><Route size={12} /> {Number(sharedKm).toFixed(1)} km shared</span> : null}
        {savingRs ? <span style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4 }}><IndianRupee size={12} /> You save ₹{Math.round(savingRs)}</span> : null}
        {coRiders ? <span style={{ color: "var(--text-muted)" }}>{coRiders} co-rider{coRiders > 1 ? "s" : ""}</span> : null}
      </div>
    </div>
  );
};
export default PoolCard;
