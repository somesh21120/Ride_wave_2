import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, clearError, sendOtp } from "../redux/authSlice";
import { Mail, Lock, User, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { useToast } from "../context/ToastContext";
import AuthLayout from "../components/auth/AuthLayout";

const PassengerRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);
  useEffect(() => { if (error) { toast(error, "error"); dispatch(clearError()); } }, [error]);

  const handleSendOtp = async () => {
    if (!form.email) return toast("Enter your email first", "error");
    setSendingOtp(true);
    try {
      const res = await sendOtp(form.email);
      setOtpSent(true);
      toast(`OTP sent to ${form.email} (demo OTP: ${res.otp})`, "info");
    } catch (e) { toast(e?.response?.data?.message || "Could not send OTP", "error"); }
    setSendingOtp(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast("Password must be at least 6 characters", "error");
    if (!form.otp) return toast("Enter the OTP sent to your email", "error");
    dispatch(registerUser({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: "passenger", otp: form.otp }));
  };

  const fields = [
    { label: "Full Name", key: "name", type: "text", placeholder: "John Doe", Icon: User },
    { label: "Email Address", key: "email", type: "email", placeholder: "you@example.com", Icon: Mail },
    { label: "Password", key: "password", type: "password", placeholder: "Min. 6 characters", Icon: Lock },
    { label: "Phone Number", key: "phone", type: "tel", placeholder: "+91 99999 99999", Icon: Phone },
  ];

  return (
    <AuthLayout title="Ride together." subtitle="Create your passenger account and start booking rides in minutes.">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {fields.map(({ label, key, type, placeholder, Icon }) => (
          <div key={key}>
            <label className="rw-label">{label}</label>
            <div style={{ position: "relative" }}>
              <input type={type} placeholder={placeholder} className="rw-input" style={{ paddingLeft: "40px" }} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
              <Icon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
          </div>
        ))}
        <div>
          <label className="rw-label">Email Verification</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input type="text" placeholder="Enter OTP" className="rw-input" style={{ paddingLeft: "40px" }} value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} required />
              <ShieldCheck size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
            <button type="button" className="rw-btn-secondary" onClick={handleSendOtp} disabled={sendingOtp} style={{ fontSize: "0.8rem", whiteSpace: "nowrap", padding: "0 14px" }}>{sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}</button>
          </div>
          {otpSent && <p style={{ color: "var(--success)", fontSize: "0.72rem", marginTop: "4px" }}>Check the toast message for your demo OTP.</p>}
        </div>
        <button type="submit" className="rw-btn-primary" disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}>{loading ? "Creating account..." : (<>Create Account <ArrowRight size={16} /></>)}</button>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "8px", fontSize: "0.875rem" }}>
          Already have an account? <Link to="/login/passenger" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
export default PassengerRegister;