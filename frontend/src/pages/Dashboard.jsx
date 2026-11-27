import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { MapPin, Car, TrendingUp, PiggyBank, Clock, Zap, ArrowRight } from "lucide-react";
import api from "../services/api";
import SavedPlaceChips from "../components/places/SavedPlaceChips";
import EmptyState from "../components/ui/EmptyState";
import CountUp from "../components/ui/CountUp";
import { EmptyRides } from "../components/illustrations";

const LIVE_TEXT = { requested: "Finding a driver", accepted: "Driver on the way", ongoing: "On your trip" };

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/rides/my-rides");
        setRides(Array.isArray(data?.rides || data) ? (data.rides || data) : []);
      } catch { setRides([]); }
      setLoading(false);
    };
    if (user?.role === "passenger") fetch(); else setLoading(false);
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "";

  const completedRides = rides.filter(r => r.status === "completed");
  const activeRide = rides.find(r => ["requested", "accepted", "ongoing"].includes(r.status));
  const recentRides = completedRides.slice(0, 3);
  const ridesThisMonth = completedRides.filter(r => {
    const d = new Date(r.createdAt || r.updatedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalSpent = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
  const totalPoolSavings = completedRides.reduce((sum, r) => sum + (r.poolSavings || 0), 0);

  if (user?.role !== "passenger") {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/driver"} replace />;
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)", padding: "24px 16px 96px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }} className="rw-fade-up">
      {/* Greeting */}
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "4px" }}>
        {greeting}, {firstName}.
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>Ready for your next ride?</p>

      {/* Where to? card */}
      <div className="rw-card" style={{ padding: "20px", marginBottom: "20px" }}>
        <button onClick={() => navigate("/book")} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", background: "var(--surface-2)", border: "none", borderRadius: "var(--radius-md)", padding: "14px 16px", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.95rem", fontFamily: "var(--font-sans)", textAlign: "left" }}>
          <MapPin size={18} color="var(--brand)" />
          Where to?
        </button>
        <div style={{ marginTop: "12px" }}>
          <SavedPlaceChips onSelect={(place) => navigate(`/book?to=${encodeURIComponent(place.address)}`)} />
        </div>
      </div>

      {/* Active ride card */}
      {activeRide && (
        <Link to="/my-rides" style={{ textDecoration: "none", display: "block", marginBottom: "20px" }}>
          <div className="rw-card rw-card-hover" style={{ padding: "16px", borderLeft: "4px solid var(--brand)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span className="rw-badge" style={{ background: "var(--brand-light)", color: "var(--brand)", display: "inline-flex", alignItems: "center", gap: 6 }}><span className="rw-live-dot" />{LIVE_TEXT[activeRide.status] || activeRide.status}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--brand)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>Track ride <ArrowRight size={13} /></span>
            </div>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
              {activeRide.pickupLocation?.address?.split(",")[0] || "Pickup"} → {activeRide.dropoffLocation?.address?.split(",")[0] || "Dropoff"}
            </p>
            {activeRide.driver && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                {activeRide.driver.name} · {activeRide.driver.vehicle?.model || activeRide.driver.vehicle?.number || ""}
              </p>
            )}
          </div>
        </Link>
      )}

      {/* Stat cards */}
      <div className="rw-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Rides this month", value: ridesThisMonth.length },
          { label: "Total spent", value: totalSpent, prefix: "₹" },
          { label: "Saved with pool", value: totalPoolSavings, prefix: "₹" },
        ].map(({ label, value, prefix }) => (
          <div key={label} className="rw-stat">
            <p className="rw-stat-label">{label}</p>
            {loading ? <div className="rw-skeleton" style={{ height: "28px", width: "60%", marginTop: "6px" }} /> : <p className="rw-stat-value"><CountUp value={value} prefix={prefix} /></p>}
          </div>
        ))}
      </div>

      {/* Recent rides */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p className="rw-section-title">Recent rides</p>
          {rides.length > 3 && <Link to="/my-rides" style={{ color: "var(--brand)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>View all</Link>}
        </div>
        {loading ? (
          [0, 1].map((i) => <div key={i} className="rw-skeleton" style={{ height: "58px", borderRadius: "var(--radius-lg)", marginBottom: "8px" }} />)
        ) : recentRides.length === 0 ? (
          <div className="rw-card">
            <EmptyState illustration={EmptyRides} width={140} title="No rides yet" text="Book your first one. Pool rides share the route and the fare." action={<Link to="/book" className="rw-btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>Book a ride</Link>} />
          </div>
        ) : (
          recentRides.map((r) => (
            <div key={r._id} className="rw-card rw-card-hover" style={{ padding: "12px 16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
                  {r.pickupLocation?.address?.split(",")[0] || "?"} → {r.dropoffLocation?.address?.split(",")[0] || "?"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {new Date(r.createdAt || r.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>₹{r.fare || 0}</p>
                <span className={`rw-badge rw-badge-${r.status === "completed" ? "success" : r.status === "cancelled" ? "danger" : "info"}`} style={{ fontSize: "0.65rem" }}>{r.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      </div>
    </div>
  );
};
export default Dashboard;
