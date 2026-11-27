import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { NotFoundRoad } from "../components/illustrations";
const NotFound = () => (
  <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-secondary)", padding: "24px" }}>
    <div style={{ textAlign: "center", maxWidth: "420px" }}>
      <NotFoundRoad width={220} />
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.5rem, 4vw, 2rem)", letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "8px" }}>Looks like you've taken a wrong turn</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "28px" }}>The page you're looking for doesn't exist or may have been moved.</p>
      <Link to="/" style={{ textDecoration: "none" }}><button className="rw-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><Home size={16} /> Go home</button></Link>
    </div>
  </div>
);
export default NotFound;
