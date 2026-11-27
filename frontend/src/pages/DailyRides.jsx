import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createRecurring, getMyRecurring, updateRecurring, deleteRecurring } from "../redux/recurringSlice";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import PlacesAutocomplete from "../components/PlacesAutocomplete";
import { Trash2, Power, Plus, Clock } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import { EmptyRides } from "../components/illustrations";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DailyRides = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { items, loading } = useSelector((s) => s.recurring);
  const [showForm, setShowForm] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [rideType, setRideType] = useState("car");
  const [time, setTime] = useState("09:00");
  const [days, setDays] = useState([1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(getMyRecurring()); }, [dispatch]);

  const toggleDay = (d) => setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());

  const handleCreate = async () => {
    if (!pickup || !dropoff) return toast("Select pickup and dropoff", "error");
    if (days.length === 0) return toast("Select at least one day", "error");
    setSaving(true);
    const result = await dispatch(createRecurring({ pickupLocation: pickup, dropoffLocation: dropoff, rideType, paymentMethod: "cash", time, daysOfWeek: days }));
    if (result.meta.requestStatus === "fulfilled") {
      toast("Daily ride created!", "success");
      setShowForm(false); setPickup(null); setDropoff(null);
    } else toast(result.payload || "Could not create", "error");
    setSaving(false);
  };

  const handleToggle = (item) => dispatch(updateRecurring({ id: item._id, changes: { active: !item.active } }));
  const handleDelete = (id) => { if (window.confirm("Delete this daily ride?")) dispatch(deleteRecurring(id)); };

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)" }}>
      <PageHeader compact eyebrow="Passenger" title="Daily Rides" subtitle="Automate your recurring commute" maxWidth="780px"
        actions={<button className="rw-btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}><Plus size={14} /> New</button>} />
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "24px" }}>
        {showForm && (
          <div className="rw-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
            <div><label className="rw-label">Pickup</label><PlacesAutocomplete placeholder="Search pickup..." onPlaceSelect={setPickup} isPickup={true} value={pickup} /></div>
            <div><label className="rw-label">Dropoff</label><PlacesAutocomplete placeholder="Search dropoff..." onPlaceSelect={setDropoff} isPickup={false} value={dropoff} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div><label className="rw-label">Ride Type</label>
                <select className="rw-input" value={rideType} onChange={(e) => setRideType(e.target.value)}>
                  <option value="bike">Bike</option><option value="auto">Auto</option><option value="car">Car</option>
                </select>
              </div>
              <div><label className="rw-label">Time</label><input type="time" className="rw-input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            </div>
            <div>
              <label className="rw-label">Repeat On</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {DAYS.map((d, i) => (
                  <button key={d} type="button" onClick={() => toggleDay(i)} style={{ width: "42px", height: "36px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem", background: days.includes(i) ? "var(--brand)" : "var(--bg-secondary)", color: days.includes(i) ? "#0F172A" : "var(--text-secondary)", border: "none" }}>{d}</button>
                ))}
              </div>
            </div>
            <button className="rw-btn-primary" onClick={handleCreate} disabled={saving} style={{ width: "100%" }}>{saving ? "Saving..." : "Save Daily Ride"}</button>
          </div>
        )}

        {loading ? <p style={{ color: "var(--text-secondary)" }}>Loading...</p> : items.length === 0 ? (
          <div className="rw-card">
            <EmptyState illustration={EmptyRides} title="No daily rides yet" text="Set up a recurring commute and we'll book it for you automatically." />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map((item) => (
              <div key={item._id} className="rw-card" style={{ padding: "16px 20px", opacity: item.active ? 1 : 0.55 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={14} color="var(--brand)" />
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.time}</span>
                    <span className="rw-badge" style={{ background: item.active ? "#D1FAE5" : "#FEE2E2", color: item.active ? "#059669" : "#DC2626" }}>{item.active ? "Active" : "Paused"}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => handleToggle(item)} title={item.active ? "Pause" : "Resume"} style={{ background: "var(--bg-secondary)", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Power size={14} color="var(--text-secondary)" /></button>
                    <button onClick={() => handleDelete(item._id)} style={{ background: "#FEF2F2", border: "none", borderRadius: "6px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={14} color="#DC2626" /></button>
                  </div>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px", wordBreak: "break-word" }}>{item.pickupLocation.address} → {item.dropoffLocation.address}</p>
                <div style={{ display: "flex", gap: "4px" }}>
                  {DAYS.map((d, i) => (<span key={d} style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: item.daysOfWeek.includes(i) ? "var(--brand-light)" : "var(--bg-secondary)", color: item.daysOfWeek.includes(i) ? "var(--brand-dark)" : "var(--text-muted)" }}>{d}</span>))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default DailyRides;
