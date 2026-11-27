import { useState, useEffect } from "react";
import { Navigation, MapPin, Clock } from "lucide-react";
import api from "../services/api";

const SearchingDriver = ({ ride, onDriverAccepted }) => {
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState("");

  // Poll for acceptance
  useEffect(() => {
    if (!ride?._id) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/rides/${ride._id}`);
        if (data.status === "accepted" && data.driver) {
          clearInterval(interval);
          onDriverAccepted(data);
        }
      } catch { /* keep polling */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [ride?._id, onDriverAccepted]);

  // Elapsed time counter
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Booking confirmed: show an animated tick for a moment, then the radar
  const [justBooked, setJustBooked] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setJustBooked(false), 1300);
    return () => clearTimeout(t);
  }, []);

  // Rotating tips while searching
  const TIPS = ["Checking drivers on your route...", "Looking for riders going your way...", "Drivers nearby can see your request..."];
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 3000);
    return () => clearInterval(t);
  }, [TIPS.length]);

  // Animated dots
  useEffect(() => {
    const d = setInterval(() => setDots((s) => (s.length >= 3 ? "" : s + ".")), 600);
    return () => clearInterval(d);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div className="rw-card" style={{ padding: "2.5rem", maxWidth: "440px", width: "100%", textAlign: "center" }}>
        {justBooked && (
          <div className="rw-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <svg width="80" height="80" viewBox="0 0 52 52" className="rw-check-draw" aria-hidden="true">
              <circle cx="26" cy="26" r="24" fill="var(--brand-light)" stroke="var(--success)" strokeWidth="2.5" />
              <path d="M15 27l7 7 15-16" fill="none" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontWeight: 700, color: "var(--success)" }}>Ride requested</p>
          </div>
        )}
        {/* Pulsing radar animation */}
        <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 20px", display: justBooked ? "none" : "block" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--brand)", opacity: 0.15, animation: "rw-ping 1.5s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: "10px", borderRadius: "50%", background: "var(--brand)", opacity: 0.25, animation: "rw-ping 1.5s ease-in-out infinite 0.3s" }} />
          <div style={{ position: "absolute", inset: "20px", borderRadius: "50%", background: "var(--brand)", opacity: 0.4, animation: "rw-ping 1.5s ease-in-out infinite 0.6s" }} />
          <div style={{ position: "absolute", inset: "28px", borderRadius: "50%", width: "24px", height: "24px", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Navigation size={12} color="#fff" />
          </div>
        </div>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.5rem", marginBottom: "6px" }}>
          Finding a driver{dots}
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.9rem" }}>
          Searching for nearby drivers. This usually takes less than a minute.
        </p>
        <p key={tip} className="rw-fade-up" aria-live="polite" style={{ color: "var(--brand)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "16px" }}>{TIPS[tip]}</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "20px" }}>
          <Clock size={13} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
          Searching for {mins > 0 ? `${mins}m ` : ""}{secs}s
        </p>

        {/* Trip details */}
        <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", padding: "16px", textAlign: "left", marginBottom: "16px" }}>
          {[
            ["From", ride?.pickupLocation?.address],
            ["To", ride?.dropoffLocation?.address],
            ["Distance", `${ride?.distance || 0} km`],
            ["Fare", `₹${ride?.fare || 0}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{k}</span>
              <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes rw-ping {
            0%, 100% { transform: scale(1); opacity: 0.15; }
            50% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SearchingDriver;