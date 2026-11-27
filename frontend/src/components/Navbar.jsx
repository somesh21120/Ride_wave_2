import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";
import { MapPin, History, LayoutDashboard, User, LogOut, Repeat, ShieldCheck, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import BrandLogo from "./BrandLogo";

const NavLink = ({ to, icon: Icon, label, active }) => (
  <Link to={to} style={{ display: "flex", alignItems: "center", gap: "6px", color: active ? "var(--brand)" : "var(--text-secondary)", fontWeight: active ? 600 : 500, fontSize: "0.9rem", textDecoration: "none", padding: "6px 16px", borderRadius: "var(--radius-pill)", transition: "color 0.12s, background 0.12s", background: active ? "var(--brand-light)" : "transparent" }}>
    <Icon size={16} />{label}
  </Link>
);

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const path = location.pathname;

  useEffect(() => {
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, height: "68px", background: "color-mix(in srgb, var(--bg-primary) 82%, transparent)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandLogo to="/" />
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {user?.role === "passenger" && (<><NavLink to="/book" icon={MapPin} label="Book Ride" active={path === "/book"} /><NavLink to="/my-rides" icon={History} label="My Rides" active={path === "/my-rides"} />
            <NavLink to="/daily-rides" icon={Repeat} label="Daily Rides" active={path === "/daily-rides"} /></>)}
          {user?.role === "driver" && (<NavLink to="/driver" icon={LayoutDashboard} label="Dashboard" active={path === "/driver"} />)}
          {user?.role === "admin" && (<NavLink to="/admin" icon={ShieldCheck} label="Admin Panel" active={path === "/admin"} />)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ThemeToggle />
          <div ref={menuRef} style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "var(--brand-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem" }}>{initials}</div>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>
            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: "42px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", minWidth: "180px", padding: "6px", zIndex: 200 }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", marginBottom: "4px" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{user?.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{user?.role}</p>
                </div>
                <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.875rem", textDecoration: "none" }}><User size={15} /> Profile</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontSize: "0.875rem", textDecoration: "none" }}><MapPin size={15} /> Saved places</Link>
                <button onClick={() => { dispatch(logout()); navigate("/login"); }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-sm)", color: "var(--danger)", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}><LogOut size={15} /> Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
