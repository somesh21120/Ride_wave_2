import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../context/ToastContext";
import { User, Mail, Phone, Shield, Car, Bike, Edit2, Save, X, LogOut } from "lucide-react";
import { logout } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import SavedPlacesManager from "../components/places/SavedPlacesManager";
const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const { toast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDriver = user?.role === "driver";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "", phone: user?.phone || "",
    vehicleType: user?.vehicle?.type || "", vehicleModel: user?.vehicle?.model || "",
    vehicleNumber: user?.vehicle?.number || "", carSubtype: user?.vehicle?.carSubtype || "",
    seatingCapacity: user?.vehicle?.seatingCapacity || 0,
  });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try { await api.put("/auth/profile", form); toast("Profile updated successfully", "success"); setEditing(false); }
    catch (e) { toast(e?.response?.data?.message || "Could not update profile", "error"); }
    setSaving(false);
  };
  const handleLogout = () => { dispatch(logout()); navigate("/login"); };
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";
  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)" }}>
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)", padding: "40px 24px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "72px", height: "72px", background: "var(--brand)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: "#0F172A", fontWeight: 700, fontSize: "1.5rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{user?.name?.[0]?.toUpperCase()}</span></div>
          <div>
            <h1 style={{ color: "#F1F5F9", fontWeight: 700, fontSize: "1.5rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{user?.name}</h1>
            <p style={{ color: "#94A3B8", fontSize: "0.875rem", marginTop: "2px" }}>{user?.email}</p>
            <span style={{ background: "var(--brand)", color: "#0F172A", fontSize: "0.72rem", fontWeight: 700, padding: "2px 10px", borderRadius: "20px", display: "inline-block", marginTop: "6px", textTransform: "capitalize" }}>{user?.role}</span>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="rw-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Account Information</h2>
            {!editing ? (<button className="rw-btn-secondary" onClick={() => setEditing(true)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", padding: "7px 14px" }}><Edit2 size={13} /> Edit</button>) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="rw-btn-secondary" onClick={() => setEditing(false)} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", padding: "7px 12px" }}><X size={13} /> Cancel</button>
                <button className="rw-btn-primary" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.8rem", padding: "7px 14px" }}><Save size={13} /> {saving ? "Saving..." : "Save"}</button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={16} color="var(--text-secondary)" /></div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Full Name</p>
                {editing ? (<input className="rw-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ fontSize: "0.875rem", padding: "8px 12px" }} />) : (<p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem" }}>{user?.name}</p>)}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Mail size={16} color="var(--text-secondary)" /></div>
              <div style={{ flex: 1, minWidth: 0 }}><p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Email Address</p><p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p></div>
              <span style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "6px", fontWeight: 500, flexShrink: 0 }}>Cannot change</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Phone size={16} color="var(--text-secondary)" /></div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Phone Number</p>
                {editing ? (<input className="rw-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ fontSize: "0.875rem", padding: "8px 12px" }} />) : (<p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem" }}>{user?.phone || "Not set"}</p>)}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Car size={16} color="var(--text-secondary)" /></div>
              <div><p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Account Type</p><p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem", textTransform: "capitalize" }}>{user?.role}</p></div>
            </div>

            {/* Vehicle section — driver only */}
            {isDriver && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "4px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Vehicle Details</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "4px" }}>Vehicle Type</p>
                    {editing ? (
                      <select className="rw-input" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} style={{ fontSize: "0.875rem", padding: "8px 12px" }}>
                        <option value="">Select</option>
                        <option value="bike">Bike</option>
                        <option value="auto">Auto</option>
                        <option value="car">Car</option>
                      </select>
                    ) : (
                      <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem", textTransform: "capitalize" }}>{user?.vehicle?.type || "Not set"}</p>
                    )}
                  </div>
                  <div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "4px" }}>Vehicle Model</p>
                    {editing ? (
                      <input className="rw-input" value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} placeholder="e.g. Maruti Swift" style={{ fontSize: "0.875rem", padding: "8px 12px" }} />
                    ) : (
                      <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem" }}>{user?.vehicle?.model || "Not set"}</p>
                    )}
                  </div>
                  <div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "4px" }}>Vehicle Number</p>
                    {editing ? (
                      <input className="rw-input" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="e.g. KA 01 AB 1234" style={{ fontSize: "0.875rem", padding: "8px 12px" }} />
                    ) : (
                      <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem" }}>{user?.vehicle?.number || "Not set"}</p>
                    )}
                  </div>
                  {form.vehicleType === "car" && (
                    <>
                      <div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "4px" }}>Car Subtype</p>
                        {editing ? (
                          <select className="rw-input" value={form.carSubtype} onChange={(e) => setForm({ ...form, carSubtype: e.target.value })} style={{ fontSize: "0.875rem", padding: "8px 12px" }}>
                            <option value="">Select</option>
                            <option value="Sedan">Sedan</option>
                            <option value="SUV">SUV</option>
                            <option value="Hatchback">Hatchback</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem" }}>{user?.vehicle?.carSubtype || "Not set"}</p>
                        )}
                      </div>
                      <div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "4px" }}>Seating Capacity (incl. driver)</p>
                        {editing ? (
                          <input type="number" className="rw-input" value={form.seatingCapacity} onChange={(e) => setForm({ ...form, seatingCapacity: Number(e.target.value) })} min={2} max={9} style={{ fontSize: "0.875rem", padding: "8px 12px" }} />
                        ) : (
                          <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem" }}>{user?.vehicle?.seatingCapacity || "Not set"}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {user?.role === "passenger" && <SavedPlacesManager />}
        <div className="rw-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}><Shield size={18} color="var(--text-secondary)" /><h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Security</h2></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)", marginBottom: "14px" }}>
            <div><p style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--text-primary)" }}>Member since</p><p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{memberSince}</p></div>
          </div>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", fontFamily: "var(--font-sans)", width: "100%" }}><LogOut size={15} /> Sign out of your account</button>
        </div>
      </div>
    </div>
  );
};
export default Profile;
