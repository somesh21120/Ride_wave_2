import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyRides } from "../redux/rideSlice";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { MapPin, Navigation, Car, Bike, Ban, RefreshCw, Plus, Clock, Star, User, Users, Zap } from "lucide-react";
import ReviewForm from "../components/ReviewForm";
import DriverEnRoute from "../components/DriverEnRoute";
import { SkeletonCard } from "../components/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import CountUp from "../components/ui/CountUp";
import { EmptyRides, NoResults } from "../components/illustrations";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active", match: (r) => ["requested", "accepted", "ongoing"].includes(r.status) },
  { id: "completed", label: "Completed", match: (r) => r.status === "completed" },
  { id: "cancelled", label: "Cancelled", match: (r) => r.status === "cancelled" },
];
const STATUS = {
  requested:  { label: "Finding driver", color: "var(--brand-dark)", bg: "var(--brand-light)" },
  accepted:   { label: "Driver on the way", color: "#2563EB", bg: "#DBEAFE" },
  ongoing:    { label: "Ride ongoing", color: "#7C3AED", bg: "#EDE9FE" },
  completed:  { label: "Completed", color: "#059669", bg: "#D1FAE5" },
  cancelled:  { label: "Cancelled", color: "#DC2626", bg: "#FEE2E2" },
};
const RIDE_ICONS = { bike: Bike, auto: Car, car: Car };
const MyRides = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { rides: rawRides, loading } = useSelector((state) => state.ride);
  const rides = Array.isArray(rawRides) ? rawRides.filter(Boolean) : [];
  const [cancelling, setCancelling] = useState(null);
  const [reviewingRide, setReviewingRide] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => { dispatch(getMyRides()); }, [dispatch]);
  // Live updates come over Socket.IO (see SocketContext). This slower poll is only
  // a safety net in case the socket drops.
  useEffect(() => {
    const interval = setInterval(() => dispatch(getMyRides()), 20000);
    return () => clearInterval(interval);
  }, [dispatch]);
  const handleCancel = async (rideId) => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;
    setCancelling(rideId);
    try { await api.put(`/rides/${rideId}/cancel`); toast("Ride cancelled", "info"); dispatch(getMyRides()); }
    catch (e) { toast(e?.response?.data?.message || "Could not cancel ride", "error"); }
    setCancelling(null);
  };
  const completedRides = rides.filter(r => r.status === "completed");
  const activeRides = rides.filter(r => r.status === "accepted" || r.status === "ongoing");
  const totalSpent = completedRides.reduce((sum, r) => sum + (Number(r.fare) || 0), 0);
  const totalSaved = rides.reduce((sum, r) => sum + (Number(r.poolSavings) || 0), 0);
  const activeFilter = FILTERS.find((f) => f.id === filter) || FILTERS[0];
  const listed = activeFilter.match ? rides.filter(activeFilter.match) : rides;
  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)" }}>
      <PageHeader compact eyebrow="Passenger" title="My Rides" subtitle={`${rides.length} ride${rides.length !== 1 ? "s" : ""} total`} maxWidth="780px"
        actions={(<>
          <button className="rw-btn-secondary" onClick={() => dispatch(getMyRides())} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}><RefreshCw size={14} /> Refresh</button>
          <Link to="/book" style={{ textDecoration: "none" }}><button className="rw-btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}><Plus size={14} /> Book Ride</button></Link>
        </>)} />
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "24px" }}>
        {activeRides.length > 0 && (
          <>
            <h2 className="rw-section-title" style={{ marginBottom: "12px" }}>Live ride</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {activeRides.map((ride) => {
                const s = STATUS[ride.status] || STATUS.requested;
                // Use DriverEnRoute for accepted rides (driver on the way)
                if ((ride.status === "accepted" || ride.status === "ongoing") && ride.driver) {
                  return (
                    <DriverEnRoute
                      key={ride._id}
                      ride={ride}
                      role="passenger"
                      onCancel={handleCancel}
                      actionLoading={cancelling}
                    />
                  );
                }
                return (
                  <div key={ride._id} className="rw-card" style={{ padding: "20px", borderLeft: "4px solid #10B981" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem", textTransform: "capitalize" }}>{ride.rideType} Ride</p>
                        <span className="rw-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        {ride.poolMatchStatus === "matched" && (
                          <span className="rw-badge" style={{ background: "#DCFCE7", color: "#16A34A", marginLeft: "6px" }}><Users size={11} style={{ display: "inline", marginRight: 3 }} /> Pooled</span>
                        )}
                        {ride.poolMatchStatus === "reverted_to_solo" && (
                          <span className="rw-badge" style={{ background: "var(--brand-light)", color: "var(--brand-dark)", marginLeft: "6px" }}><Zap size={11} style={{ display: "inline", marginRight: 3 }} /> Solo</span>
                        )}
                      </div>
                      <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text-primary)" }}>₹{ride.fare}</p>
                    </div>
                    {ride.driver && (
                      <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", background: "var(--border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={16} color="var(--text-secondary)" /></div>
                        <div><p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{ride.driver.name}</p><p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{ride.driver.phone}</p></div>
                      </div>
                    )}
                    {ride.poolMatchStatus === "matched" && ride.poolSavings > 0 && (
                      <div style={{ background: "#F0FDF4", borderRadius: "8px", padding: "8px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Users size={14} color="#16A34A" />
                        <span style={{ color: "#16A34A", fontSize: "0.82rem", fontWeight: 600 }}>Pooled ride: you saved ₹{ride.poolSavings}</span>
                        {ride.poolMatchNote && <span style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500, marginTop: "2px" }}>Why matched: {ride.poolMatchNote}</span>}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}><MapPin size={14} color="#0F766E" style={{ marginTop: "2px", flexShrink: 0 }} /><p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{ride.pickupLocation?.address || "Pickup"}</p></div>
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}><Navigation size={14} color="#B08D57" style={{ marginTop: "2px", flexShrink: 0 }} /><p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{ride.dropoffLocation?.address || "Drop-off"}</p></div>
                    </div>
                    {(ride.status === "requested" || ride.status === "accepted") && (
                      <button onClick={() => handleCancel(ride._id)} disabled={cancelling === ride._id} className="rw-btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", borderColor: "var(--danger)", color: "var(--danger)", width: "100%", marginTop: "12px", height: "44px" }}><Ban size={13} />{cancelling === ride._id ? "Cancelling..." : "Cancel Ride"}</button>
                    )}
                    <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "10px", textAlign: "center" }}>Updates live as soon as anything changes.</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {rides.length > 0 && (
          <div className="rw-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "Total rides", value: rides.length },
              { label: "Completed", value: completedRides.length },
              { label: "Total spent", value: totalSpent, prefix: "₹" },
              { label: "Saved by pooling", value: totalSaved, prefix: "₹" },
            ].map(({ label, value, prefix }) => (
              <div key={label} className="rw-stat"><p className="rw-stat-label">{label}</p><p className="rw-stat-value"><CountUp value={value} prefix={prefix} /></p></div>
            ))}
          </div>
        )}
        {rides.length > 0 && (
          <div role="tablist" aria-label="Filter rides" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
            {FILTERS.map((f) => {
              const count = f.match ? rides.filter(f.match).length : rides.length;
              return (
                <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={`rw-chip${filter === f.id ? " is-active" : ""}`}>
                  {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : rides.length === 0 ? (
          <div className="rw-card">
            <EmptyState illustration={EmptyRides} title="No rides yet" text="Book your first ride. Choose Pool to share the trip and pay less." action={<Link to="/book" className="rw-btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>Book a ride</Link>} />
          </div>
        ) : listed.length === 0 ? (
          <div className="rw-card">
            <EmptyState compact illustration={NoResults} width={120} title={`No ${activeFilter.label.toLowerCase()} rides`} action={<button className="rw-btn-ghost" onClick={() => setFilter("all")}>Show all rides</button>} />
          </div>
        ) : (
          <div className="rw-stagger" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {listed.map((ride) => {
              const s = STATUS[ride.status] || STATUS.requested;
              const RideIcon = RIDE_ICONS[ride.rideType] || Car;
              return (
                <div key={ride._id} className="rw-card rw-card-hover" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><RideIcon size={20} color="var(--text-secondary)" /></div>
                      <div>
                        <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem", textTransform: "capitalize" }}>{ride.rideType} Ride</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "4px" }}><Clock size={11} />{new Date(ride.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {ride.poolMatchStatus === "matched" && <span className="rw-badge" style={{ background: "#DCFCE7", color: "#16A34A" }}>Pooled</span>}
                      {ride.poolMatchStatus === "reverted_to_solo" && <span className="rw-badge" style={{ background: "var(--brand-light)", color: "var(--brand-dark)" }}>Solo</span>}
                      <span className="rw-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px", paddingLeft: "4px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}><MapPin size={14} color="#0F766E" style={{ marginTop: "2px", flexShrink: 0 }} /><p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.4 }}>{ride.pickupLocation?.address || "Pickup"}</p></div>
                    <div style={{ marginLeft: "6px", borderLeft: "1.5px dashed var(--border)", height: "10px" }} />
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}><Navigation size={14} color="#B08D57" style={{ marginTop: "2px", flexShrink: 0 }} /><p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.4 }}>{ride.dropoffLocation?.address || "Drop-off"}</p></div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{ride.distance} km</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", textTransform: "capitalize" }}>{ride.paymentMethod}</span>
                      {ride.driver && <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Driver assigned</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      {(ride.status === "requested" || ride.status === "accepted") && (<button onClick={() => handleCancel(ride._id)} disabled={cancelling === ride._id} className="rw-btn-secondary" style={{ display: "flex", alignItems: "center", gap: "5px", borderColor: "var(--danger)", color: "var(--danger)", height: "44px", padding: "0 14px", fontSize: "0.8rem" }}><Ban size={13} />{cancelling === ride._id ? "Cancelling..." : "Cancel"}</button>)}
                      {ride.status === "completed" && ride.driver && reviewingRide !== ride._id && (
                        <button onClick={() => setReviewingRide(ride._id)} className="rw-btn-secondary" style={{ display: "flex", alignItems: "center", gap: "5px", height: "44px", padding: "0 14px", fontSize: "0.8rem" }}><Star size={13} /> Rate Driver</button>
                      )}
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)" }}>₹{ride.fare}</span>
                        {ride.poolMatchStatus === "matched" && ride.poolSavings > 0 && (
                          <p style={{ color: "#16A34A", fontSize: "0.72rem", fontWeight: 600, marginTop: "2px" }}>Saved ₹{ride.poolSavings}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {reviewingRide === ride._id && ride.driver && (
                    <ReviewForm rideId={ride._id} revieweeName={ride.driver?.name || "Driver"} onDone={() => { setReviewingRide(null); dispatch(getMyRides()); }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default MyRides;
