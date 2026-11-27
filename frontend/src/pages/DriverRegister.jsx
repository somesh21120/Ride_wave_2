import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, clearError, sendOtp } from "../redux/authSlice";
import { Mail, Lock, User, Phone, ArrowRight, Car, Upload, ShieldCheck } from "lucide-react";
import { useToast } from "../context/ToastContext";
import AuthLayout from "../components/auth/AuthLayout";
import PhoneInput from "../components/ui/PhoneInput";

const DriverRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", otp: "",
    vehicleType: "bike", vehicleModel: "", vehicleNumber: "", seatingCapacity: 4,
  });
  const [idProofName, setIdProofName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);
  useEffect(() => { if (error) { toast(error, "error"); dispatch(clearError()); } }, [error]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setIdProofName(file.name);
  };

  const handleSendOtp = async () => {
    if (!form.email) return toast("Enter your email first", "error");
    setSendingOtp(true);
    try {
      const res = await sendOtp(form.email);
      setOtpSent(true);
            toast("OTP sent to your email.", "info");
    } catch (e) { toast(e?.response?.data?.message || "Could not send OTP", "error"); }
    setSendingOtp(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast("Password must be at least 6 characters", "error");
    if (!form.vehicleModel || !form.vehicleNumber) return toast("Please fill in vehicle details", "error");
    if (!form.otp) return toast("Enter the OTP sent to your email", "error");
    dispatch(registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      otp: form.otp,
      role: "driver",
      vehicleType: form.vehicleType,
      vehicleModel: form.vehicleModel,
      vehicleNumber: form.vehicleNumber,
      seatingCapacity: form.seatingCapacity,
      idProof: idProofName,
    }));
  };

  return (
    <AuthLayout title="Ride together." subtitle="Join as a driver-partner and start earning on your own schedule.">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label className="rw-label">Full Name</label>
          <div style={{ position: "relative" }}>
            <input type="text" placeholder="John Doe" className="rw-input" style={{ paddingLeft: "40px" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
        </div>
        <div>
          <label className="rw-label">Email Address</label>
          <div style={{ position: "relative" }}>
            <input type="email" placeholder="you@example.com" className="rw-input" style={{ paddingLeft: "40px" }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
        </div>
        <div>
          <label className="rw-label">Phone Number</label>
          <div style={{ position: "relative" }}>
            <PhoneInput placeholder="99999 99999" className="rw-input" style={{ paddingLeft: "40px" }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <Phone size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
        </div>
        <div>
          <label className="rw-label">Password</label>
          <div style={{ position: "relative" }}>
            <input type="password" placeholder="Min. 6 characters" className="rw-input" style={{ paddingLeft: "40px" }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>
        </div>

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

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
          <p style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Vehicle Details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label className="rw-label">Vehicle Type</label>
              <select className="rw-input" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                <option value="bike">Bike</option>
                <option value="auto">Auto</option>
                <option value="car">Car</option>
              </select>
            </div>
            <div>
              <label className="rw-label">Vehicle Model</label>
              <div style={{ position: "relative" }}>
                <input type="text" placeholder="e.g. Honda Activa, Maruti Swift" className="rw-input" style={{ paddingLeft: "40px" }} value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} required />
                <Car size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>
            </div>
            <div>
              <label className="rw-label">Vehicle Number</label>
              <input type="text" placeholder="e.g. KA 01 AB 1234" className="rw-input" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} required />
            </div>
            {(form.vehicleType === "auto" || form.vehicleType === "car") && (
              <div>
                <label className="rw-label">Seating Capacity (incl. driver)</label>
                <input type="number" min={form.vehicleType === "auto" ? 3 : 2} max={form.vehicleType === "auto" ? 7 : 9} className="rw-input" value={form.seatingCapacity} onChange={(e) => setForm({ ...form, seatingCapacity: e.target.value })} placeholder={form.vehicleType === "auto" ? "e.g. 4" : "e.g. 5"} />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="rw-label">ID Proof Upload</label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", border: "1.5px dashed var(--border)", borderRadius: "10px", padding: "12px 14px", cursor: "pointer", color: "var(--text-secondary)" }}>
            <Upload size={16} color="var(--brand)" />
            <span style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idProofName || "Upload ID proof (image or PDF)"}</span>
            <input type="file" accept="image/*,.pdf" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
        </div>

        <button type="submit" className="rw-btn-primary" disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}>{loading ? "Creating account..." : (<>Create Account <ArrowRight size={16} /></>)}</button>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "8px", fontSize: "0.875rem" }}>
          Already have an account? <Link to="/login/driver" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
export default DriverRegister;