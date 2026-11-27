import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, clearError } from "../redux/authSlice";
import { ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) { dispatch(clearError()); }
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-secondary)",
      padding: "24px"
    }}>
      <div className="rw-card" style={{
        width: "100%",
        maxWidth: "400px",
        padding: "40px 32px",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: "24px" }}>
          <BrandLogo size={36} textSize="1.3rem" />
        </div>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--brand-light)",
          color: "var(--brand)",
          padding: "6px 16px",
          borderRadius: "var(--radius-pill)",
          fontSize: "0.8rem",
          fontWeight: 600,
          marginBottom: "8px"
        }}>
          <ShieldCheck size={14} />
          Admin Panel
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          fontSize: "1.5rem",
          color: "var(--text-primary)",
          marginBottom: "4px"
        }}>
          Sign in
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "28px" }}>
          Admin credentials only
        </p>

        {error && (
          <div style={{
            background: "var(--danger-light, #FEE2E2)",
            color: "var(--danger, #DC2626)",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "16px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
          <div>
            <label className="rw-label">Email address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="admin@ridewave.app"
                className="rw-input"
                style={{ paddingLeft: "40px" }}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>
          <div>
            <label className="rw-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="Enter admin password"
                className="rw-input"
                style={{ paddingLeft: "40px" }}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>
          <button
            type="submit"
            className="rw-btn-primary"
            disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}
          >
            {loading ? "Signing in..." : (<>Sign In <ArrowRight size={16} /></>)}
          </button>
        </form>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "20px" }}>
          Demo: <strong>admin@ridewave.app</strong> / <strong>Admin@123</strong>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;