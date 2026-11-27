import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, clearError } from "../redux/authSlice";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useToast } from "../context/ToastContext";
import AuthLayout from "../components/auth/AuthLayout";

const PassengerLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);
  useEffect(() => { if (error) { toast(error, "error"); dispatch(clearError()); } }, [error]);

  const handleSubmit = (e) => { e.preventDefault(); dispatch(loginUser(form)); };

  return (
    <AuthLayout title="Welcome back." subtitle="Sign in to book rides, track your trips, and manage your account.">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label className="rw-label">Email address</label>
          <div style={{ position: "relative" }}>
            <input type="email" placeholder="you@example.com" className="rw-input" style={{ paddingLeft: "40px" }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
        </div>
        <div>
          <label className="rw-label">Password</label>
          <div style={{ position: "relative" }}>
            <input type="password" placeholder="Enter your password" className="rw-input" style={{ paddingLeft: "40px" }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
        </div>
        <button type="submit" className="rw-btn-primary" disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}>{loading ? "Signing in..." : (<>Sign In <ArrowRight size={16} /></>)}</button>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "8px", fontSize: "0.875rem" }}>
          New here? <Link to="/register/passenger" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
export default PassengerLogin;