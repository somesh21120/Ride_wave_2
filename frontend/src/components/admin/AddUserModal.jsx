import { useState } from "react";
import { X } from "lucide-react";
import api from "../../services/api";
import PhoneInput from "../ui/PhoneInput";

/**
 * Admin: create a driver, passenger or admin account directly (no OTP).
 * Backend: POST /api/admin/users  (see docs/API.md)
 */
const EMPTY = {
  role: "driver", name: "", email: "", phone: "", password: "",
  vehicleType: "", vehicleModel: "", vehicleNumber: "", carSubtype: "", seatingCapacity: "",
};

const AddUserModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.role === "driver" && (!form.vehicleType || !form.vehicleNumber)) {
      setError("Drivers need a vehicle type and number.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, seatingCapacity: form.seatingCapacity ? Number(form.seatingCapacity) : undefined };
      const { data } = await api.post("/admin/users", payload);
      onCreated?.(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create user");
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }} onClick={onClose}>
      <form className="rw-card" onSubmit={submit} onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", width: "100%", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>Add Driver / User</h2>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="var(--text-secondary)" /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div><label className="rw-label">Role</label>
            <select className="rw-input" value={form.role} onChange={set("role")}>
              <option value="driver">Driver</option><option value="passenger">Passenger</option><option value="admin">Admin</option>
            </select>
          </div>
          <div><label className="rw-label">Full name</label><input className="rw-input" required value={form.name} onChange={set("name")} /></div>
          <div><label className="rw-label">Email</label><input type="email" className="rw-input" required value={form.email} onChange={set("email")} /></div>
          <div><label className="rw-label">Phone</label><PhoneInput className="rw-input" required value={form.phone} onChange={set("phone")} /></div>
          <div><label className="rw-label">Temporary password (min 6 characters)</label><input type="text" className="rw-input" required minLength={6} value={form.password} onChange={set("password")} /></div>

          {form.role === "driver" && (
            <>
              <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>Vehicle</p>
              <div><label className="rw-label">Vehicle type</label>
                <select className="rw-input" value={form.vehicleType} onChange={set("vehicleType")}>
                  <option value="">Select</option><option value="bike">Bike</option><option value="auto">Auto</option><option value="car">Car</option>
                </select>
              </div>
              <div><label className="rw-label">Vehicle number</label><input className="rw-input" placeholder="GJ03AB1234" value={form.vehicleNumber} onChange={set("vehicleNumber")} /></div>
              <div><label className="rw-label">Vehicle model</label><input className="rw-input" placeholder="e.g. Maruti Swift" value={form.vehicleModel} onChange={set("vehicleModel")} /></div>
              {form.vehicleType === "car" && (
                <>
                  <div><label className="rw-label">Car subtype</label>
                    <select className="rw-input" value={form.carSubtype} onChange={set("carSubtype")}>
                      <option value="">Select</option><option value="Hatchback">Hatchback</option><option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Other">Other</option>
                    </select>
                  </div>
                  <div><label className="rw-label">Seating capacity (incl. driver)</label><input type="number" min={2} max={9} className="rw-input" value={form.seatingCapacity} onChange={set("seatingCapacity")} /></div>
                </>
              )}
            </>
          )}

          {error && <p role="alert" style={{ color: "#DC2626", fontSize: "0.85rem" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button type="button" className="rw-btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="rw-btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? "Saving..." : "Create account"}</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddUserModal;
