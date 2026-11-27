import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, Phone, X } from "lucide-react";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import { AllClear } from "../illustrations";
import EmptyState from "../ui/EmptyState";

/**
 * Admin "Safety alerts": rides with an SOS in the last 24 h (GET /admin/rides?sos=1),
 * refreshed live when the server pushes ride:sos, plus a red banner for the newest alert.
 */
const timeAgo = (d) => {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
};

const SafetyAlerts = ({ onOpenRide }) => {
  const { sosEvent } = useSocket() || {};
  const { toast } = useToast();
  const [alerts, setAlerts] = useState(null);
  const [banner, setBanner] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/rides", { params: { sos: 1 } });
      setAlerts(data);
    } catch {
      setAlerts([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!sosEvent?.seq) return;
    setBanner(sosEvent);
    toast(`SOS alert on a ride${sosEvent.pickup ? ` from ${sosEvent.pickup}` : ""}`, "error");
    load();
  }, [sosEvent?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {banner && (
        <div role="alert" className="rw-fade-up" style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--danger)", color: "#fff", borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: "14px", boxShadow: "var(--shadow-md)" }}>
          <ShieldAlert size={22} className="rw-sos-pulse" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700 }}>SOS alert received</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>{banner.pickup ? `Ride from ${banner.pickup}` : "A rider needs help"} · status {banner.status || "active"}</p>
          </div>
          {onOpenRide && <button className="rw-btn-secondary" style={{ background: "#fff", color: "var(--danger)", borderColor: "#fff", height: "36px", fontSize: "0.8rem" }} onClick={() => onOpenRide(banner.rideId)}>Open ride</button>}
          <button onClick={() => setBanner(null)} aria-label="Dismiss alert" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>
      )}
      <div className="rw-card" style={{ padding: "18px 20px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <p className="rw-section-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}><ShieldAlert size={14} /> Safety alerts (last 24 h)</p>
          {alerts?.length > 0 && <span className="rw-badge" style={{ background: "var(--danger)", color: "#fff" }}>{alerts.length}</span>}
        </div>
        {alerts === null && <div className="rw-skeleton" style={{ height: "56px", width: "100%" }} />}
        {alerts?.length === 0 && <EmptyState compact illustration={AllClear} width={110} title="All clear" text="No SOS alerts in the last 24 hours." />}
        {alerts?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {alerts.map((r) => (
              <button key={r._id} onClick={() => onOpenRide && onOpenRide(r._id)} className="rw-card-hover" style={{ textAlign: "left", display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer" }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--danger)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.pickupLocation?.address || "Pickup"} to {r.dropoffLocation?.address || "Drop-off"}
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                    By {r.sosBy?.name || "a rider"} ({r.sosBy?.role || "passenger"}) · {timeAgo(r.sosAt)} · ride {r.status}
                  </p>
                </div>
                {r.passenger?.phone && (
                  <a href={`tel:${r.passenger.phone}`} onClick={(e) => e.stopPropagation()} aria-label="Call the passenger" style={{ display: "flex", color: "var(--brand)" }}><Phone size={16} /></a>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SafetyAlerts;
