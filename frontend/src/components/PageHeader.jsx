const GRADIENT = "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)";
const PageHeader = ({ eyebrow, title, subtitle, compact = false, maxWidth = "1000px", actions, centered = false }) => (
  <div style={{ background: GRADIENT, padding: compact ? "28px 24px" : "64px 24px 72px" }}>
    <div style={{ maxWidth, margin: "0 auto", display: "flex", justifyContent: centered ? "center" : "space-between", alignItems: centered ? "center" : "flex-end", flexDirection: centered ? "column" : "row", textAlign: centered ? "center" : "left", flexWrap: "wrap", gap: "16px" }}>
      <div>
        {eyebrow && (<p style={{ color: "var(--brand)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>{eyebrow}</p>)}
        <h1 style={{ color: "#F8FAFC", fontWeight: 800, fontSize: compact ? "1.5rem" : "2.25rem", letterSpacing: "-1px", marginBottom: subtitle ? "14px" : 0, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ color: "#94A3B8", fontSize: compact ? "0.85rem" : "1rem", lineHeight: 1.7, maxWidth: centered ? "620px" : "none" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>{actions}</div>}
    </div>
  </div>
);
export default PageHeader;
