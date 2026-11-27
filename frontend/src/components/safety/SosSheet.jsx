import { useState } from "react";
import { Phone, Share2, ShieldAlert, X } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

const SosSheet = ({ rideId, onClose, canShare = true }) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleSos = async () => {
    if (!window.confirm("Alert RideWave support? This will notify the admin team.")) return;
    setSending(true);
    try {
      await api.post(`/rides/${rideId}/sos`);
      toast("Support has been alerted.", "info");
    } catch { toast("Could not send alert. Try calling 112.", "error"); }
    setSending(false);
  };

  const handleShare = async () => {
    try {
      const { data } = await api.post(`/rides/${rideId}/share`);
      const url = window.location.origin + "/trip/" + data.token;
      if (navigator.share) {
        await navigator.share({ title: "RideWave trip", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Trip link copied to clipboard", "info");
      }
    } catch { toast("Could not share trip", "error"); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div className="rw-card" style={{ width: "100%", maxWidth: "400px", padding: "24px", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", marginTop: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={20} /> Safety
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <a href="tel:112" className="rw-btn-danger" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", marginBottom: "12px", fontSize: "1.05rem", height: "52px" }}>
          <Phone size={20} /> Call 112
        </a>

        {canShare && <button className="rw-btn-secondary" onClick={handleShare} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", marginBottom: "12px" }}>
          <Share2 size={16} /> Share trip with a contact
        </button>}

        <button className="rw-btn-secondary" onClick={handleSos} disabled={sending} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", color: "var(--danger)", borderColor: "var(--danger)" }}>
          <ShieldAlert size={16} /> {sending ? "Sending..." : "Alert RideWave support"}
        </button>
      </div>
    </div>
  );
};
export default SosSheet;