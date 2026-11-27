import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
const COLUMNS = [
  { title: "Product", links: [{ to: "/", label: "Home" }, { to: "/about", label: "How it works" }] },
  { title: "Company", links: [{ to: "/about", label: "About Us" }, { to: "/contact", label: "Contact" }] },
  { title: "Legal", links: [{ to: "/terms", label: "Terms of Service" }, { to: "/privacy", label: "Privacy Policy" }] },
];
const Footer = () => (
  <footer style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border)", padding: "40px 24px 24px", marginTop: "auto" }}>
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "32px", paddingBottom: "32px", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ marginBottom: "12px" }}><BrandLogo /></div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, maxWidth: "280px" }}>Daily rides, shared smarter. RideWave connects commuters going the same way.</p>
        </div>
        {COLUMNS.map(({ title, links }) => (
          <div key={title}>
            <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>{title}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {links.map(({ to, label }) => (<Link key={label} to={to} style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}>{label}</Link>))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "20px", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>&copy; 2026 RideWave. All rights reserved.</p>
      </div>
    </div>
  </footer>
);
export default Footer;
