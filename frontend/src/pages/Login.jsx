import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, clearError } from "../redux/authSlice";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useToast } from "../context/ToastContext";
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);
  useEffect(() => { if (error) { toast(error, "error"); dispatch(clearError()); } }, [error]);
  const handleSubmit = (e) => { e.preventDefault(); dispatch(loginUser(form)); };
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex" }}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #0F172A 0%, #1E293B 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem" }} className="rw-auth-hero">
        <div style={{ position: "relative", textAlign: "center", maxWidth: "360px" }}>
          <p style={{ display: "inline-block", background: "var(--brand-light)", border: "1px solid var(--brand)", color: "var(--brand)", fontSize: "0.8rem", fontWeight: 600, borderRadius: "20px", padding: "5px 14px", marginBottom: "20px" }}>Rated 4.8 by 10,000+ riders</p>
          <h1 style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "2.1rem", letterSpacing: "-1px", marginBottom: "12px", lineHeight: 1.2 }}>Your city, <span style={{ color: "var(--brand)" }}>your ride</span></h1>
          <p style={{ color: "#CBD5E1", fontSize: "1rem", lineHeight: 1.6 }}>Connect with drivers near you and get to your destination fast, safe, and affordably.</p>
        </div>
      </div>
      <div style={{ width: "440px", maxWidth: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg-primary)" }}>
        <div style={{ width: "100%", maxWidth: "360px" }}>
          <h2 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.75rem", letterSpacing: "-0.5px", marginBottom: "6px" }}>Welcome back</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "28px" }}>Sign in to your account to continue</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[{ label: "Email address", key: "email", type: "email", ph: "you@example.com", Icon: Mail }, { label: "Password", key: "password", type: "password", ph: "Enter your password", Icon: Lock }].map(({ label, key, type, ph, Icon }) => (
              <div key={key}>
                <label className="rw-label">{label}</label>
                <div style={{ position: "relative" }}>
                  <input type={type} placeholder={ph} className="rw-input" style={{ paddingLeft: "40px" }} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
                  <Icon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                </div>
              </div>
            ))}
            <button type="submit" className="rw-btn-primary" disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}>{loading ? "Signing in..." : (<>Sign In <ArrowRight size={16} /></>)}</button>
          </form>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "20px", fontSize: "0.875rem" }}>Don't have an account? <Link to="/register" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Create one</Link></p>
        </div>
      </div>
    </div>
  );
};
export default Login;
