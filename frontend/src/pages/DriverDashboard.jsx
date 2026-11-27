import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAvailableRides } from "../redux/rideSlice";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import { Car, Bike, RefreshCw, CheckCircle, Phone, User, Star, Ban, ShieldAlert, Users, Power, IndianRupee, Route as RouteIcon, Inbox } from "lucide-react";
import ReviewForm from "../components/ReviewForm";
import DriverEnRoute from "../components/DriverEnRoute";
import { useSocket } from "../context/SocketContext";
import SosSheet from "../components/safety/SosSheet";
import EmptyState from "../components/ui/EmptyState";
import CountUp from "../components/ui/CountUp";
import { DriverOnline, EmptyRequests } from "../components/illustrations";

const ONLINE_KEY = "rw-driver-online";
const readOnline = () => {
  try { return localStorage.getItem(ONLINE_KEY) !== "off"; } catch { return true; }
};
const isToday = (d) => {
  if (!d) return false;
  const x = new Date(d), n = new Date();
  return x.getFullYear() === n.getFullYear() && x.getMonth() === n.getMonth() && x.getDate() === n.getDate();
};
const RIDE_ICONS = { bike: Bike, auto: Car, car: Car };
/** Pickup and drop-off with a thin vertical route line */
const RouteLines = ({ ride }) => (
  <div style={{ display: "grid", gridTemplateColumns: "16px 1fr", columnGap: "10px", rowGap: "2px", marginBottom: "14px" }}>
    <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--brand)", marginTop: 5, justifySelf: "center" }} />
    <p style={{ color: "var(--text-primary)", fontSize: "0.86rem", lineHeight: 1.4 }}>{ride.pickupLocation?.address}</p>
    <span style={{ width: 2, minHeight: 14, background: "var(--border)", justifySelf: "center" }} />
    <span />
    <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--gold)", marginTop: 5, justifySelf: "center" }} />
    <p style={{ color: "var(--text-primary)", fontSize: "0.86rem", lineHeight: 1.4 }}>{ride.dropoffLocation?.address}</p>
  </div>
);

const DriverDashboard = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { availableRides, loading } = useSelector((state) => state.ride);
  const [actionLoading, setActionLoading] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [myRides, setMyRides] = useState([]);
  const [reviewingRide, setReviewingRide] = useState(null);
  const refresh = useCallback(() => { dispatch(getAvailableRides()); setLastRefresh(new Date()); }, [dispatch]);
  useEffect(() => { refresh(); const interval = setInterval(refresh, 30000); return () => clearInterval(interval); }, [refresh]);

  const loadMyRides = useCallback(async () => {
    try { const { data } = await api.get("/rides/driver-rides"); setMyRides(data); } catch { }
  }, []);
  // Server pushes ride events over Socket.IO; refresh both lists the moment one arrives.
  const { rideEvent, goOnline, goOffline } = useSocket() || {};
  const { user } = useSelector((state) => state.auth);
  const [online, setOnline] = useState(readOnline);
  const [sosRideId, setSosRideId] = useState(null);

  // Online / offline: offline hides new requests and tells the server this driver is unavailable
  const toggleOnline = () => {
    const next = !online;
    setOnline(next);
    try { localStorage.setItem(ONLINE_KEY, next ? "on" : "off"); } catch { /* private mode */ }
    if (!user?._id) return;
    if (!next) { goOffline?.(user._id); toast("You are offline. New requests are paused.", "info"); return; }
    toast("You are online. New requests will appear here.", "success");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => goOnline?.(user._id, { lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => goOnline?.(user._id, null),
        { timeout: 8000 }
      );
    } else goOnline?.(user._id, null);
  };
  useEffect(() => {
    if (rideEvent?.seq) { loadMyRides(); refresh(); }
  }, [rideEvent?.seq, loadMyRides, refresh]);
  useEffect(() => {
    loadMyRides();
    const interval = setInterval(loadMyRides, 20000); // safety-net poll; sockets do the real-time work
    return () => clearInterval(interval);
  }, [loadMyRides]);

  const activeRides = myRides.filter((r) => r.status === "accepted" || r.status === "ongoing");
  const completedRides = myRides.filter((r) => r.status === "completed");
  const todayDone = completedRides.filter((r) => isToday(r.completedAt || r.updatedAt));
  const todayEarnings = todayDone.reduce((sum, r) => sum + (Number(r.fare) || 0), 0);
  const firstName = (user?.name || "").split(" ")[0];

  const handleAccept = async (rideId) => {
    setActionLoading(rideId + "accept");
    try { await api.put(`/rides/${rideId}/accept`); toast("Ride accepted! Head to the pickup location.", "success"); refresh(); loadMyRides(); }
    catch (e) { toast(e?.response?.data?.message || "Could not accept ride", "error"); }
    setActionLoading(null);
  };
  const handleStart = async (rideId, otp) => {
    setActionLoading(rideId + "start");
    try { await api.put(`/rides/${rideId}/start`, { otp }); toast("Code verified. Ride started.", "success"); loadMyRides(); }
    catch (e) { toast(e?.response?.data?.message || "Could not start ride", "error"); }
    setActionLoading(null);
  };
  const handleComplete = async (rideId) => {
    setActionLoading(rideId + "complete");
    try { await api.put(`/rides/${rideId}/complete`); toast("Ride completed!", "success"); loadMyRides(); }
    catch (e) { toast(e?.response?.data?.message || "Could not complete ride", "error"); }
    setActionLoading(null);
  };
  const handleCancel = async (rideId) => {
    if (!window.confirm("Cancel this ride?")) return;
    setActionLoading(rideId + "cancel");
    try { await api.put(`/rides/${rideId}/cancel`); toast("Ride cancelled", "info"); loadMyRides(); }
    catch (e) { toast(e?.response?.data?.message || "Could not cancel ride", "error"); }
    setActionLoading(null);
  };
  const handleReject = async (rideId) => {
    setActionLoading(rideId + "reject");
    try { await api.put(`/rides/${rideId}/reject`); toast("Ride rejected", "info"); refresh(); }
    catch (e) { toast(e?.response?.data?.message || "Could not reject ride", "error"); }
    setActionLoading(null);
  };

  const loadingBtn = (key) => actionLoading === key;
  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)" }}>
      <PageHeader compact eyebrow="Driver"
        title={firstName ? `Hello, ${firstName}` : "Driver dashboard"}
        subtitle={online ? `${availableRides.length} request${availableRides.length !== 1 ? "s" : ""} waiting · updated ${lastRefresh.toLocaleTimeString()}` : "You are offline"}
        maxWidth="820px"
        actions={(<button className="rw-btn-secondary" onClick={() => { refresh(); loadMyRides(); }} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}><RefreshCw size={14} /> Refresh</button>)} />
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px 16px 32px" }}>

        {/* Online / offline */}
        <div className="rw-card rw-fade-up" style={{ padding: "18px 20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", background: online ? "var(--brand-light)" : "var(--surface)" }}>
          {online ? <DriverOnline width={110} /> : <div style={{ width: 110, display: "flex", justifyContent: "center" }}><Power size={40} color="var(--text-muted)" /></div>}
          <div style={{ flex: "1 1 200px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", lineHeight: 1.1, color: "var(--text-primary)" }}>{online ? "You're online" : "You're offline"}</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>{online ? "Receiving ride requests in real time." : "Go online to start receiving ride requests."}</p>
          </div>
          <button role="switch" aria-checked={online} aria-label="Online status" onClick={toggleOnline} className="rw-switch" data-on={online ? "true" : "false"}>
            <span className="rw-switch-knob" />
          </button>
        </div>

        {/* Today's stats */}
        <div className="rw-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Today's trips", value: todayDone.length, Icon: CheckCircle },
            { label: "Today's earnings", value: todayEarnings, prefix: "₹", Icon: IndianRupee },
            { label: "Requests waiting", value: online ? availableRides.length : 0, Icon: Inbox },
            { label: "All-time trips", value: completedRides.length, Icon: RouteIcon },
          ].map(({ label, value, prefix, Icon }) => (
            <div key={label} className="rw-stat rw-card-hover">
              <p className="rw-stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon size={13} /> {label}</p>
              <p className="rw-stat-value"><CountUp value={value} prefix={prefix} /></p>
            </div>
          ))}
        </div>

        {activeRides.length > 0 && (
          <>
            <h2 className="rw-section-title" style={{ marginBottom: "12px" }}>Active rides</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              {activeRides.map((ride) => {
                const RideIcon = RIDE_ICONS[ride.rideType] || Car;
                if (ride.status === "accepted") {
                  return (
                    <DriverEnRoute key={ride._id} ride={ride} role="driver" onStartRide={handleStart} onCancel={handleCancel} actionLoading={actionLoading} />
                  );
                }
                return (
                  <div key={ride._id} className="rw-card rw-fade-up" style={{ padding: "20px", borderLeft: "4px solid var(--success)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ background: "var(--brand-light)", borderRadius: "12px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}><RideIcon size={20} color="var(--brand)" /></div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", textTransform: "capitalize" }}>{ride.rideType} ride</p>
                          <span className="rw-badge" style={{ background: "var(--ai-light)", color: "var(--ai)" }}>On trip</span>
                        </div>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--text-primary)" }}>₹{ride.fare}</p>
                    </div>
                    {ride.passenger && (
                      <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "34px", height: "34px", background: "var(--brand)", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: "0.85rem" }}>{(ride.passenger.name || "?").slice(0, 1).toUpperCase()}</div>
                        <div style={{ flex: 1 }}><p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{ride.passenger.name}</p>{ride.passenger.phone && <a href={`tel:${ride.passenger.phone}`} style={{ color: "var(--brand)", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}><Phone size={11} /> {ride.passenger.phone}</a>}</div>
                      </div>
                    )}
                    <RouteLines ride={ride} />
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button className="rw-btn-primary" onClick={() => handleComplete(ride._id)} disabled={!!actionLoading} data-loading={loadingBtn(ride._id + "complete") ? "true" : undefined} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        {loadingBtn(ride._id + "complete") ? (<><span className="rw-spinner" aria-hidden="true" /> Completing...</>) : (<><CheckCircle size={15} /> Complete ride</>)}
                      </button>
                      <button className="rw-btn-danger" onClick={() => setSosRideId(ride._id)} aria-label="SOS safety options" style={{ height: "48px", padding: "0 18px", display: "inline-flex", alignItems: "center", gap: "6px" }}><ShieldAlert size={15} /> SOS</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <h2 className="rw-section-title" style={{ marginBottom: "12px" }}>Ride requests</h2>
        {!online ? (
          <div className="rw-card"><EmptyState illustration={DriverOnline} title="You're offline" text="Go online with the switch above to see new ride requests." action={<button className="rw-btn-primary" onClick={toggleOnline}><Power size={15} /> Go online</button>} /></div>
        ) : loading && availableRides.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{[1, 2].map((i) => <div key={i} className="rw-skeleton" style={{ height: "170px", borderRadius: "var(--radius-lg)" }} />)}</div>
        ) : availableRides.length === 0 ? (
          <div className="rw-card"><EmptyState illustration={EmptyRequests} title="No requests right now" text="New requests appear here the moment a passenger books. Keep this page open." /></div>
        ) : (
          <div className="rw-stagger" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {availableRides.map((ride) => {
              const RideIcon = RIDE_ICONS[ride.rideType] || Car;
              const isPool = ride.rideCategory === "pool";
              return (
                <div key={ride._id} className="rw-card rw-card-hover" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "var(--brand-light)", borderRadius: "12px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}><RideIcon size={20} color="var(--brand)" /></div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", textTransform: "capitalize", display: "flex", alignItems: "center", gap: "8px" }}>
                          {ride.rideType} ride
                          {isPool && <span className="rw-badge" style={{ background: "var(--ai-light)", color: "var(--ai)", display: "inline-flex", alignItems: "center", gap: 4 }}><Users size={11} /> Pool</span>}
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{ride.distance} km · {ride.paymentMethod}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>₹{ride.fare}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>estimated fare</p>
                    </div>
                  </div>
                  {ride.passenger && (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}><User size={13} /> {ride.passenger.name}</p>
                  )}
                  <RouteLines ride={ride} />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="rw-btn-primary" onClick={() => handleAccept(ride._id)} disabled={!!actionLoading} data-loading={loadingBtn(ride._id + "accept") ? "true" : undefined} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      {loadingBtn(ride._id + "accept") ? (<><span className="rw-spinner" aria-hidden="true" /> Accepting...</>) : (<><CheckCircle size={15} /> Accept ride</>)}
                    </button>
                    <button className="rw-btn-secondary" onClick={() => handleReject(ride._id)} disabled={!!actionLoading} style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                      <Ban size={13} />{loadingBtn(ride._id + "reject") ? "..." : "Skip"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {completedRides.length > 0 && (
          <>
            <h2 className="rw-section-title" style={{ margin: "28px 0 12px" }}>Completed rides</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {completedRides.slice(0, 10).map((ride) => (
                <div key={ride._id} className="rw-card" style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: reviewingRide === ride._id ? "10px" : 0, flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", textTransform: "capitalize" }}>{ride.rideType} ride · ₹{ride.fare}</p>
                      {ride.passenger && <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Passenger: {ride.passenger.name}</p>}
                    </div>
                    {reviewingRide !== ride._id && (
                      <button className="rw-btn-ghost" onClick={() => setReviewingRide(ride._id)} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.82rem" }}><Star size={13} /> Rate passenger</button>
                    )}
                  </div>
                  {reviewingRide === ride._id && (
                    <ReviewForm rideId={ride._id} revieweeName={ride.passenger?.name || "Passenger"} onDone={() => setReviewingRide(null)} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {sosRideId && <SosSheet rideId={sosRideId} canShare={false} onClose={() => setSosRideId(null)} />}
    </div>
  );
};
export default DriverDashboard;
