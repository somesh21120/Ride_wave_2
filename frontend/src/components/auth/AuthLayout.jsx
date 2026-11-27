import { Link, useLocation } from "react-router-dom";
import BrandLogo from "../BrandLogo";
import { AuthCity } from "../illustrations";

const BENEFITS = [
  "Real-time ride tracking with live driver location",
  "Upfront fares — no surge surprises",
  "Pool rides and split the fare fairly",
];

const AuthLayout = ({ title, subtitle, children }) => {
  const location = useLocation();
  const isLogin = location.pathname.includes("login");

  return (
    <div style={{ minHeight: "calc(100vh - 68px)", display: "flex" }}>
      {/* Brand panel */}
      <div style={{ flex: "0 0 45%", position: "relative", overflow: "hidden", background: "var(--hero-glow), var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }} className="rw-auth-hero">
        <div style={{ position: "relative", textAlign: "center", maxWidth: "360px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <BrandLogo size={40} textSize="1.4rem" />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", letterSpacing: "-0.02em", marginBottom: "12px", lineHeight: 1.15, color: "var(--text-primary)" }}>
            {title}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "32px" }}>{subtitle}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left", maxWidth: "280px", margin: "0 auto" }}>
            {BENEFITS.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="7" fill="var(--brand-light)" />
                  <path d="M5 8.5L7 10.5L11 6" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "32px" }}>
                      <AuthCity width={200} />
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg-primary)" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Segmented control */}
          <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "var(--radius-pill)", padding: "3px", marginBottom: "32px" }}>
            <Link to={isLogin ? "/login/passenger" : "/register/passenger"} style={{ flex: 1, textAlign: "center", padding: "8px 16px", borderRadius: "var(--radius-pill)", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", color: location.pathname.includes("passenger") ? "var(--brand-ink)" : "var(--text-secondary)", background: location.pathname.includes("passenger") ? "var(--brand)" : "transparent" }}>Passenger</Link>
            <Link to={isLogin ? "/login/driver" : "/register/driver"} style={{ flex: 1, textAlign: "center", padding: "8px 16px", borderRadius: "var(--radius-pill)", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", color: location.pathname.includes("driver") ? "var(--brand-ink)" : "var(--text-secondary)", background: location.pathname.includes("driver") ? "var(--brand)" : "transparent" }}>Driver</Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;