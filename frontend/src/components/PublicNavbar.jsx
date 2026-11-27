import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import BrandLogo from "./BrandLogo";
const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "How it works", hash: true },
  { to: "/about", label: "About" },
];
const PublicNavbar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, height: "68px", background: "color-mix(in srgb, var(--bg-primary) 82%, transparent)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandLogo to="/" />
        {!isMobile && (<>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {NAV_LINKS.map(({ to, label }) => (<Link key={to} to={to} style={{ color: location.pathname === to ? "var(--brand)" : "var(--text-secondary)", fontWeight: location.pathname === to ? 600 : 500, fontSize: "0.9rem", textDecoration: "none", padding: "6px 16px", borderRadius: "var(--radius-pill)", background: location.pathname === to ? "var(--brand-light)" : "transparent" }}>{label}</Link>))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ThemeToggle />
            {user ? (<Link to="/dashboard" style={{ textDecoration: "none" }}><button className="rw-btn-primary" style={{ fontSize: "0.875rem", height: "40px", padding: "0 18px" }}>Dashboard</button></Link>) : (<>
              <Link to="/login/passenger" style={{ textDecoration: "none" }}><button className="rw-btn-ghost" style={{ fontSize: "0.875rem" }}>Log in</button></Link>
              <Link to="/register/passenger" style={{ textDecoration: "none" }}><button className="rw-btn-primary" style={{ fontSize: "0.875rem", height: "40px", padding: "0 18px" }}>Get started</button></Link>
            </>)}
          </div>
        </>)}
        {isMobile && (<div style={{ display: "flex", alignItems: "center", gap: "10px" }}><ThemeToggle /><button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", display: "flex" }}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button></div>)}
      </div>
      {isMobile && mobileOpen && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-primary)", padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV_LINKS.map(({ to, label }) => (<Link key={to} to={to} onClick={() => setMobileOpen(false)} style={{ color: location.pathname === to ? "var(--brand)" : "var(--text-primary)", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none", padding: "10px 12px", borderRadius: "var(--radius-md)", background: location.pathname === to ? "var(--brand-light)" : "transparent" }}>{label}</Link>))}
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            {user ? (<Link to="/dashboard" style={{ textDecoration: "none", flex: 1 }}><button className="rw-btn-primary" style={{ width: "100%" }}>Dashboard</button></Link>) : (<>
              <Link to="/login/passenger" style={{ textDecoration: "none", flex: 1 }}><button className="rw-btn-secondary" style={{ width: "100%" }}>Log in</button></Link>
              <Link to="/register/passenger" style={{ textDecoration: "none", flex: 1 }}><button className="rw-btn-primary" style={{ width: "100%" }}>Get started</button></Link>
            </>)}
          </div>
        </div>
      )}
    </nav>
  );
};
export default PublicNavbar;
