import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bookRide, getOpenPools, joinPool } from "../redux/rideSlice";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import PlacesAutocomplete from "../components/PlacesAutocomplete";
import { Users, Car, Bike, MapPin, Navigation, RefreshCw } from "lucide-react";

const getDistance = (p, d) => {
  const dLat = ((d.lat - p.lat) * Math.PI) / 180, dLon = ((d.lng - p.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((p.lat * Math.PI) / 180) * Math.cos((d.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};
const POOL_ICONS = { carpool: Car, bikepool: Bike };

const JoinPoolForm = ({ pool, onJoined }) => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [pickup, setPickup] = useState(null);
  const [joining, setJoining] = useState(false);
  const handleJoin = async () => {
    if (!pickup) return toast("Select your pickup location first", "error");
    setJoining(true);
    const distance = getDistance(pickup, pool.dropoffLocation);
    const result = await dispatch(joinPool({ rideId: pool._id, pickupLocation: pickup, distance }));
    if (result.meta.requestStatus === "fulfilled") { toast("Joined pool ride!", "success"); onJoined(); }
    else toast(result.payload || "Could not join pool", "error");
    setJoining(false);
  };
  return (
    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed var(--border)" }}>
      <PlacesAutocomplete placeholder="Your pickup location..." onPlaceSelect={setPickup} isPickup={true} />
      <button className="rw-btn-primary" onClick={handleJoin} disabled={joining || !pickup} style={{ width: "100%", marginTop: "10px" }}>
        {joining ? "Joining..." : "Confirm & Join"}
      </button>
    </div>
  );
};

const Pool = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { openPools, loading } = useSelector((s) => s.ride);
  const [tab, setTab] = useState("find");
  const [openId, setOpenId] = useState(null);

  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const poolType = "carpool"; // bikes cannot be pooled
  const [seatsTotal, setSeatsTotal] = useState(3);
  const [creating, setCreating] = useState(false);

  useEffect(() => { dispatch(getOpenPools()); }, [dispatch]);

  const handleCreate = async () => {
    if (!pickup || !dropoff) return toast("Select pickup and dropoff", "error");
    const distance = getDistance(pickup, dropoff);
    setCreating(true);
    const result = await dispatch(bookRide({
      pickupLocation: pickup, dropoffLocation: dropoff, distance,
      rideType: "car", paymentMethod: "cash",
      rideCategory: "pool", poolType, seatsTotal,
    }));
    if (result.meta.requestStatus === "fulfilled") { toast("Pool ride created!", "success"); setPickup(null); setDropoff(null); }
    else toast(result.payload || "Could not create pool", "error");
    setCreating(false);
  };

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)" }}>
      <PageHeader compact eyebrow="Passenger" title="Pool Rides" subtitle="Share a ride, split the fare" maxWidth="900px"
        actions={<button className="rw-btn-secondary" onClick={() => dispatch(getOpenPools())} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}><RefreshCw size={14} /> Refresh</button>} />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[{ v: "find", l: "Find a Pool" }, { v: "create", l: "Start a Pool" }].map(({ v, l }) => (
            <button key={v} onClick={() => setTab(v)} className={tab === v ? "rw-btn-primary" : "rw-btn-secondary"} style={{ fontSize: "0.875rem" }}>{l}</button>
          ))}
        </div>

        {tab === "find" && (
          loading ? <p style={{ color: "var(--text-secondary)" }}>Loading pools...</p> :
          openPools.length === 0 ? (
            <div className="rw-card" style={{ padding: "48px 24px", textAlign: "center" }}>
              <Users size={32} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700 }}>No open pools right now</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Check back soon, or start your own pool ride.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {openPools.map((pool) => {
                const Icon = POOL_ICONS[pool.poolType] || Car;
                return (
                  <div key={pool._id} className="rw-card" style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ background: "var(--brand-light)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={18} color="var(--brand-dark)" /></div>
                        <div><p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", textTransform: "capitalize" }}>{pool.poolType}</p><p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>By {pool.passenger?.name} · {pool.seatsAvailable} seat{pool.seatsAvailable !== 1 ? "s" : ""} left</p></div>
                      </div>
                      <span className="rw-badge" style={{ background: "#DBEAFE", color: "#2563EB" }}>Open</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", gap: "8px" }}><MapPin size={13} color="#10B981" /><p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{pool.pickupLocation.address}</p></div>
                      <div style={{ display: "flex", gap: "8px" }}><Navigation size={13} color="#EF4444" /><p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{pool.dropoffLocation.address}</p></div>
                    </div>
                    {openId === pool._id ? (
                      <JoinPoolForm pool={pool} onJoined={() => { setOpenId(null); dispatch(getOpenPools()); }} />
                    ) : (
                      <button className="rw-btn-primary" onClick={() => setOpenId(pool._id)} style={{ width: "100%" }}>Join This Pool</button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "create" && (
          <div className="rw-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" }}>
            <div><label className="rw-label">Pickup</label><PlacesAutocomplete placeholder="Search pickup..." onPlaceSelect={setPickup} isPickup={true} value={pickup} /></div>
            <div><label className="rw-label">Dropoff</label><PlacesAutocomplete placeholder="Search dropoff..." onPlaceSelect={setDropoff} isPickup={false} value={dropoff} /></div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Pool rides are by car only: a bike carries one passenger.</p>
            <div>
              <label className="rw-label">Total Seats (including you)</label>
              <select className="rw-input" value={seatsTotal} onChange={(e) => setSeatsTotal(Number(e.target.value))}>
                {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button className="rw-btn-primary" onClick={handleCreate} disabled={creating || !pickup || !dropoff} style={{ width: "100%" }}>{creating ? "Creating..." : "Start Pool Ride"}</button>
          </div>
        )}
      </div>
    </div>
  );
};
export default Pool;
