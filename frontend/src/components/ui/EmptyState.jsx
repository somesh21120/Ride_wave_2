/**
 * Empty state: illustration + one sentence + optional action button.
 * Usage: <EmptyState illustration={EmptyRides} title="No rides yet" text="Book your first ride." action={<Link ...>Book a ride</Link>} />
 * Illustrations come from components/illustrations (see docs/ILLUSTRATIONS.md).
 */
const EmptyState = ({ illustration: Art, title, text, action, width = 150, compact = false }) => (
  <div className="rw-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: compact ? "6px" : "10px", padding: compact ? "12px 8px" : "28px 16px" }}>
    {Art && <Art width={width} />}
    {title && <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: compact ? "0.95rem" : "1.05rem" }}>{title}</p>}
    {text && <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", maxWidth: "340px" }}>{text}</p>}
    {action && <div style={{ marginTop: "6px" }}>{action}</div>}
  </div>
);

export default EmptyState;
