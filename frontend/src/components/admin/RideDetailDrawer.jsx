import { useCallback, useEffect, useState } from "react";
import { X, MapPin, Navigation, User, Car, Phone, Trash2, Users, CreditCard, Clock } from "lucide-react";
import api from "../../services/api";
import MapComponent from "../MapComponent";

/**
 * Admin ride detail drawer (Task 6).
 * Loads GET /api/admin/rides/:id and shows the full picture of one ride:
 * lifecycle timeline, people, route on a map, money and pool details.
 * Status change and delete reuse the AdminDashboard handlers.
 */
const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null);

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: "0.85rem" }}>
    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
    <span style={{ color: "var(--text-primary)", fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>{value ?? "-"}</span>
  </div>
);

const Section = ({ title, Icon, children }) => (
  <section style={{ marginTop: "18px" }}>
    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
      <Icon size={14} /> {title}
    </h3>
    {children}
  </section>
);

const RideDetailDrawer = ({ rideId, onClose, onStatusChange, onDelete, statusStyles }) => {
  const [ride, setRide] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/rides/${rideId}`);
      setRide(data);
      setError("");
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load this ride");
    }
  }, [rideId]);

  useEffect(() => { load(); }, [load]);

  // Close with Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const s = ride ? (statusStyles[ride.status] || statusStyles.requested) : null;
  const timeline = ride ? [
    { label: "Requested", at: ride.createdAt },
    { label: "Accepted", at: ride.acceptedAt },
    { label: "Started", at: ride.startedAt },
    { label: "Completed", at: ride.completedAt },
  ] : [];
  const hasCoords = (l) => l && typeof l.lat === "number" && typeof l.lng === "number";

  return (
    <>
      <div className="rw-drawer-backdrop" onClick={onClose} />
      <aside className="rw-drawer" role="dialog" aria-modal="true" aria-label="Ride details">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", textTransform: "capitalize" }}>
              {ride ? `${ride.rideType} ride` : "Ride details"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", wordBreak: "break-all" }}>ID {rideId}</p>
          </div>
          <button type="button" className="rw-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {error && <p role="alert" style={{ color: "#DC2626", marginTop: "16px", fontSize: "0.9rem" }}>{error}</p>}
        {!ride && !error && <p style={{ color: "var(--text-secondary)", marginTop: "16px" }}>Loading...</p>}

        {ride && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
              <span className="rw-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
              {ride.cancelledBy && <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>cancelled by {ride.cancelledBy}</span>}
              <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: "1.15rem", color: "var(--text-primary)" }}>₹{ride.fare}</span>
            </div>

            <Section title="Timeline" Icon={Clock}>
              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {timeline.map((t) => (
                  <li key={t.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, background: t.at ? "var(--brand)" : "var(--border)" }} />
                    <span style={{ flex: 1, fontSize: "0.85rem", color: t.at ? "var(--text-primary)" : "var(--text-muted)" }}>{t.label}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{fmt(t.at) || "-"}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Route" Icon={MapPin}>
              {hasCoords(ride.pickupLocation) && hasCoords(ride.dropoffLocation) && (
                <div style={{ height: "200px", marginBottom: "8px", borderRadius: "12px", overflow: "hidden" }}>
                  <MapComponent pickupCoords={ride.pickupLocation} dropoffCoords={ride.dropoffLocation} height="200px" />
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "4px" }}><MapPin size={14} color="#10B981" style={{ marginTop: "2px", flexShrink: 0 }} /><p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{ride.pickupLocation?.address || "-"}</p></div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}><Navigation size={14} color="#EF4444" style={{ marginTop: "2px", flexShrink: 0 }} /><p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{ride.dropoffLocation?.address || "-"}</p></div>
              <Row label="Distance" value={ride.distance ? `${Number(ride.distance).toFixed(1)} km` : "-"} />
            </Section>

            <Section title="Passenger" Icon={User}>
              <Row label="Name" value={ride.passenger?.name || "Deleted user"} />
              <Row label="Phone" value={ride.passenger?.phone ? <a href={`tel:${ride.passenger.phone}`} style={{ color: "var(--brand-dark)" }}><Phone size={12} /> {ride.passenger.phone}</a> : "-"} />
              <Row label="Email" value={ride.passenger?.email} />
            </Section>

            <Section title="Driver" Icon={Car}>
              {ride.driver ? (
                <>
                  <Row label="Name" value={ride.driver.name} />
                  <Row label="Phone" value={ride.driver.phone ? <a href={`tel:${ride.driver.phone}`} style={{ color: "var(--brand-dark)" }}><Phone size={12} /> {ride.driver.phone}</a> : "-"} />
                  <Row label="Vehicle" value={[ride.driver.vehicle?.type, ride.driver.vehicle?.model, ride.driver.vehicle?.number].filter(Boolean).join(" · ") || "-"} />
                </>
              ) : (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No driver assigned yet.</p>
              )}
            </Section>

            <Section title="Payment" Icon={CreditCard}>
              <Row label="Method" value={ride.paymentMethod} />
              <Row label="Status" value={ride.paymentStatus} />
              <Row label="Fare" value={`₹${ride.fare}`} />
            </Section>

            {(ride.poolMatchStatus && ride.poolMatchStatus !== "solo") || ride.rideCategory === "pool" ? (
              <Section title="Pool" Icon={Users}>
                <Row label="Match status" value={ride.poolMatchStatus?.replace(/_/g, " ")} />
                <Row label="Pool savings" value={ride.poolSavings ? `₹${ride.poolSavings}` : "-"} />
                <Row label="Co-riders" value={ride.coRiders?.length || 0} />
                {(ride.coRiders || []).map((c, i) => (
                  <p key={i} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", padding: "4px 0" }}>
                    {c.user?.name || "Rider"} · ₹{c.fare ?? "-"} · {c.pickupLocation?.address || ""}
                  </p>
                ))}
              </Section>
            ) : null}

            <div style={{ display: "flex", gap: "10px", marginTop: "22px", flexWrap: "wrap" }}>
              <select
                className="rw-input"
                aria-label="Change status (admin override)"
                value={ride.status}
                onChange={async (e) => { await onStatusChange(ride._id, e.target.value); load(); }}
                style={{ flex: "1 1 180px" }}
              >
                {Object.keys(statusStyles).map((k) => <option key={k} value={k}>{statusStyles[k].label}</option>)}
              </select>
              <button type="button" className="rw-btn-secondary" style={{ color: "#DC2626", borderColor: "#FCA5A5" }}
                onClick={async () => { const ok = await onDelete(ride._id); if (ok) onClose(); }}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "8px" }}>Admin status changes bypass the normal ride rules. Use them only to fix stuck rides.</p>
          </>
        )}
      </aside>
    </>
  );
};

export default RideDetailDrawer;
