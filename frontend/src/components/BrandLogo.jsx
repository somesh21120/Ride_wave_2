import { Link } from "react-router-dom";

const BrandLogo = ({ size = 28, to = "/", dark = false, textSize = "1.15rem" }) => (
  <Link to={to} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0, borderRadius: "6px" }}>
      <rect width="28" height="28" rx="6" fill="var(--brand)" />
      <circle cx="9" cy="10" r="2.5" fill="white" />
      <circle cx="19" cy="18" r="2.5" fill="white" />
      <path d="M9 10 C13 14, 15 14, 19 18" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
    <span style={{ fontWeight: 700, fontSize: textSize, color: dark ? "#F2EFE9" : "var(--text-primary)", fontFamily: "var(--font-sans)", letterSpacing: "-0.3px", whiteSpace: "nowrap", lineHeight: 1 }}>
      RideWave
    </span>
    <span style={{ fontWeight: 500, fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginLeft: "-4px", alignSelf: "flex-end", paddingBottom: "1px" }}>
      2.0
    </span>
  </Link>
);

export default BrandLogo;
