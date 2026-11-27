import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user) {
        if (user.role === "admin") navigate("/admin");
        else navigate("/");
      }
    } catch { /* ignore */ }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/admin-login", form);
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
      </div>
    </div>
  );
};

export default AdminLogin;