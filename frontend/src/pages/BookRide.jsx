import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bookRide } from "../redux/rideSlice";
import { useNavigate } from "react-router-dom";
import MapComponent from "../components/MapComponent";
import PlacesAutocomplete from "../components/PlacesAutocomplete";
import PageHeader from "../components/PageHeader";
import SearchingDriver from "../components/SearchingDriver";
import BookingSheet from "../components/booking/BookingSheet";
import SavedPlaceChips from "../components/places/SavedPlaceChips";
import { useToast } from "../context/ToastContext";
import { Bike, Car, CheckCircle, CreditCard, Banknote, Navigation, MapPin, Users, Clock, Zap, User } from "lucide-react";
import api from "../services/api";
import { getRoute } from "../services/geocode";
const MAX_RIDE_DIST = 50; // max km allowed
// India approximate bounding box
const INDIA_BOUNDS = { latMin: 6.5, latMax: 35.5, lngMin: 68.0, lngMax: 97.5 };
const isInIndia = (loc) => loc && loc.lat >= INDIA_BOUNDS.latMin && loc.lat <= INDIA_BOUNDS.latMax && loc.lng >= INDIA_BOUNDS.lngMin && loc.lng <= INDIA_BOUNDS.lngMax;
const RIDE_TYPES = [
  { type: "bike", label: "Bike", Icon: Bike, desc: "Fastest & cheapest", seats: 1, base: 20, per: 8 },
  { type: "auto", label: "Auto", Icon: Car, desc: "Comfortable ride", seats: 3, base: 30, per: 12 },
  { type: "car", label: "Car", Icon: Car, desc: "Premium experience", seats: 4, base: 50, per: 18 },
];
const getDistance = (p, d) => {
  const dLat = ((d.lat - p.lat) * Math.PI) / 180, dLon = ((d.lng - p.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((p.lat * Math.PI) / 180) * Math.cos((d.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};
const BookRide = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, currentRide } = useSelector((state) => state.ride);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [activeField, setActiveField] = useState("pickup");
  const [rideType, setRideType] = useState("car");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [searchingDriver, setSearchingDriver] = useState(null);
  const [instantPoolChoice, setInstantPool] = useState(false);
  // Pooling only for multi-seat vehicles: a bike can never be pooled
  const instantPool = instantPoolChoice && (rideType === "car" || rideType === "auto");
  const [matchStatus, setMatchStatus] = useState(null); // polling state
  const [matchedRide, setMatchedRide] = useState(null);
  const [pollComplete, setPollComplete] = useState(false);
  const pollRef = useRef(null);
  const selected = RIDE_TYPES.find(r => r.type === rideType);
  const distance = pickup && dropoff ? getDistance(pickup, dropoff) : 0;
  const fare = distance ? Math.round(selected.base + selected.per * distance) : 0;
  const poolFare = distance && instantPool ? Math.round((selected.base + selected.per * distance) * 0.7) : 0;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handlePickupChange = (loc) => { setPickup(loc); if (!dropoff) setActiveField("dropoff"); };
  const handleDropoffChange = (loc) => { setDropoff(loc); };

  const onDriverAccepted = useCallback((ride) => {
    // Navigate to MyRides where the DriverEnRoute screen will show
    navigate("/my-rides");
  }, [navigate]);

  // Poll match status every 3 seconds
  const startPolling = (rideId) => {
    setMatchStatus("waiting");
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/rides/${rideId}/match-status`);
        if (data.poolMatchStatus === "matched") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setMatchStatus("matched");
          setMatchedRide(data);
          setPollComplete(true);
          toast("Pool match found! You're riding together.", "success");
        } else if (data.poolMatchStatus === "reverted_to_solo") {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setMatchStatus("reverted_to_solo");
          setMatchedRide(data);
          setPollComplete(true);
          toast("No pool match found, booked as solo ride", "info");
        }
      } catch { /* keep polling */ }
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!pickup) return toast("Please select a pickup location", "error");
    if (!dropoff) return toast("Please select a dropoff location", "error");
    if (!isInIndia(pickup)) return toast("Pickup must be in India", "error");
    if (!isInIndia(dropoff)) return toast("Dropoff must be in India", "error");
    if (distance < 0.1) return toast("Pickup and dropoff are too close", "error");
    if (distance > MAX_RIDE_DIST) return toast("This route is too long for RideWave — try a shorter trip", "error");
    // Route sanity: OSRM must return a plausible driving route near the straight-line distance.
    // If it returns nothing or an absurd distance (e.g. no road route, ocean crossing), block booking.
    try {
      const route = await getRoute(pickup, dropoff);
      if (!route) return toast("No valid driving route found for this trip — try different locations", "error");
      if (route.distanceKm > MAX_RIDE_DIST || route.distanceKm > distance * 5) {
        return toast("This route is too long for RideWave — try a shorter trip", "error");
      }
    } catch {
      return toast("Could not verify this route — please try again", "error");
    }

    if (paymentMethod === "online") {
      // Online payment flow: create Razorpay order, open checkout, then book ride on success
      try {
        const { data: order } = await api.post("/payment/create-order", { amount: instantPool ? poolFare : fare });
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "RideWave",
          description: `${rideType} ride · ${distance} km`,
          order_id: order.id,
          handler: async (response) => {
            // Verify payment
            const { data: verify } = await api.post("/payment/verify", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            if (verify.verified) {
              // Payment succeeded — now create the ride
              const result = await dispatch(bookRide({
                pickupLocation: pickup, dropoffLocation: dropoff, distance, rideType,
                paymentMethod: "online",
                rideCategory: instantPool ? "pool" : "standard", instantPool,
              }));
              if (result.meta.requestStatus === "fulfilled") {
                if (instantPool) {
                  startPolling(result.payload._id);
                  toast("Payment successful! Searching for a pool match...", "info");
                } else {
                  setSearchingDriver(result.payload);
                  toast("Payment successful! Searching for a driver...", "success");
                }
              } else {
                toast(result.payload || "Ride booked but payment was taken — contact support", "error");
              }
            }
          },
          modal: {
            ondismiss: () => {
              toast("Payment cancelled — you can retry or switch to Cash", "error");
            },
          },
          prefill: { name: "", email: "", contact: "" },
          theme: { color: "var(--brand)" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (e) {
        toast(e?.response?.data?.message || "Payment setup failed — try again or switch to Cash", "error");
      }
      return;
    }

    // Cash payment — book immediately
    const result = await dispatch(bookRide({
      pickupLocation: pickup, dropoffLocation: dropoff, distance, rideType, paymentMethod,
      rideCategory: instantPool ? "pool" : "standard", instantPool,
    }));
    if (result.meta.requestStatus === "fulfilled") {
      if (instantPool) {
        startPolling(result.payload._id);
        toast("Searching for a pool match...", "info");
      } else {
        setSearchingDriver(result.payload);
        toast("Ride booked! Searching for a driver...", "info");
      }
    } else toast(result.payload || "Failed to book ride", "error");
  };

  // ---- Searching for driver screen ----
  if (searchingDriver) {
    return (
      <SearchingDriver
        ride={searchingDriver}
        onDriverAccepted={onDriverAccepted}
      />
    );
  }

  // ---- Confirmation screen for instant pool (polling) ----
  if (instantPool && !pollComplete && matchStatus) {
    return (
      <div style={{ minHeight: "100%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div className="rw-card" style={{ padding: "2.5rem", maxWidth: "440px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", background: "var(--brand-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "pulse 1.5s ease-in-out infinite" }}>
            <Clock size={32} color="var(--brand)" />
          </div>
          <h2 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.5rem", marginBottom: "6px" }}>Finding a Pool Match</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.9rem" }}>
            Searching for another passenger heading the same way. You'll be matched automatically within 2 minutes, or we'll book it as a solo ride at full fare.
          </p>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", padding: "16px", textAlign: "left", marginBottom: "12px" }}>
            {[["From", pickup?.address], ["To", dropoff?.address], ["Distance", `${distance} km`], ["Pool Fare", `₹${poolFare} (30% off)`]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{k}</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>You'll be notified when a match is found.</p>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
      </div>
    );
  }

  // ---- Confirmation screen for instant pool (final result) ----
  if (instantPool && pollComplete && matchedRide) {
    const isMatched = matchedRide.poolMatchStatus === "matched";
    return (
      <div style={{ minHeight: "100%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <div className="rw-card" style={{ padding: "2.5rem", maxWidth: "440px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", background: isMatched ? "#DCFCE7" : "var(--brand-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            {isMatched ? <Users size={32} color="#10B981" /> : <Zap size={32} color="var(--brand)" />}
          </div>
          <h2 style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: "1.5rem", marginBottom: "6px" }}>
            {isMatched ? "Pool Match Found!" : "Booked as Solo Ride"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.9rem" }}>
            {isMatched
              ? "Another passenger was heading the same way — you've been matched and will share the ride and fare!"
              : "No pool match was found nearby within 2 minutes. Your ride has been booked as a solo ride at full fare."}
          </p>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", padding: "16px", textAlign: "left", marginBottom: "16px" }}>
            {[
              ["From", matchedRide.poolMatchedRide?.pickupLocation?.address || matchedRide.from || pickup?.address],
              ["To", matchedRide.poolMatchedRide?.dropoffLocation?.address || matchedRide.to || dropoff?.address],
              ["Fare", `₹${matchedRide.fare}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{k}</span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            {isMatched && matchedRide.poolSavings > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>You saved</span>
                <span style={{ color: "#10B981", fontWeight: 800, fontSize: "1.1rem" }}>₹{matchedRide.poolSavings}</span>
              </div>
            )}
            {isMatched && matchedRide.poolMatchNote && (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", paddingTop: "6px" }}>Why matched: {matchedRide.poolMatchNote}</p>
            )}
          </div>
          <button className="rw-btn-primary" onClick={() => navigate("/my-rides")} style={{ width: "100%" }}>View My Rides</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-secondary)" }}>
      <PageHeader compact eyebrow="Passenger" title="Book a Ride" subtitle="Search an address, use your location, or click directly on the map" maxWidth="1200px" />
      {/* Mobile: map-first with bottom sheet */}
      <div className="rw-mobile-booking" style={{ display: "none" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <MapComponent pickupCoords={pickup} dropoffCoords={dropoff} height="100%" activeField={activeField} onPickupChange={handlePickupChange} onDropoffChange={handleDropoffChange} />
        </div>
        <BookingSheet
          pickup={pickup} dropoff={dropoff} activeField={activeField}
          rideType={rideType} paymentMethod={paymentMethod} instantPool={instantPool}
          distance={distance} fare={fare} poolFare={poolFare} loading={loading}
          onPickupChange={handlePickupChange} onDropoffChange={handleDropoffChange}
          setActiveField={setActiveField} setRideType={setRideType}
          setPaymentMethod={setPaymentMethod} setInstantPool={setInstantPool}
          onSubmit={handleSubmit}
        />
      </div>
      {/* Desktop: sidebar + map */}
      <div className="rw-desktop-booking" style={{ display: "none" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "380px 1fr", gap: "20px", alignItems: "start" }} className="rw-book-grid">
          <div className="rw-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="rw-label" style={{ margin: 0 }}>Pickup</label>
                  <button type="button" onClick={() => setActiveField("pickup")} style={{ display: "flex", alignItems: "center", gap: "4px", background: activeField === "pickup" ? "var(--brand-light)" : "transparent", border: activeField === "pickup" ? "1px solid var(--brand)" : "1px solid var(--border)", borderRadius: "20px", padding: "3px 10px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, color: activeField === "pickup" ? "var(--brand-dark)" : "var(--text-muted)", fontFamily: "var(--font-sans)" }}><MapPin size={11} /> Set on map</button>
                </div>
                <SavedPlaceChips onSelect={handlePickupChange} selected={pickup} />
                <PlacesAutocomplete placeholder="Search pickup location..." onPlaceSelect={handlePickupChange} isPickup={true} value={pickup} />
                {pickup && <p style={{ color: "var(--success)", fontSize: "0.75rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={12} /> {pickup.address}</p>}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="rw-label" style={{ margin: 0 }}>Dropoff</label>
                  <button type="button" onClick={() => setActiveField("dropoff")} style={{ display: "flex", alignItems: "center", gap: "4px", background: activeField === "dropoff" ? "var(--brand-light)" : "transparent", border: activeField === "dropoff" ? "1px solid var(--brand)" : "1px solid var(--border)", borderRadius: "20px", padding: "3px 10px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, color: activeField === "dropoff" ? "var(--brand-dark)" : "var(--text-muted)", fontFamily: "var(--font-sans)" }}><Navigation size={11} /> Set on map</button>
                </div>
                <SavedPlaceChips onSelect={handleDropoffChange} selected={dropoff} />
                <PlacesAutocomplete placeholder="Search dropoff location..." onPlaceSelect={handleDropoffChange} isPickup={false} value={dropoff} />
                {dropoff && <p style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={12} /> {dropoff.address}</p>}
              </div>
            </div>
            <div>
              <label className="rw-label">Ride Type</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                {RIDE_TYPES.map(({ type, label, Icon, desc, seats, base, per }) => (
                  <button key={type} type="button" onClick={() => setRideType(type)} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left", background: rideType === type ? "var(--brand-light)" : "var(--bg-secondary)", border: rideType === type ? "2px solid var(--brand)" : "2px solid transparent" }}>
                    <div style={{ background: rideType === type ? "var(--brand)" : "var(--border)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={18} color={rideType === type ? "#0F172A" : "var(--text-secondary)"} /></div>
                    <div style={{ flex: 1 }}><p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{label}</p><p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}><User size={12} /> {seats} seat{seats > 1 ? "s" : ""}</p></div>
                    <div style={{ textAlign: "right" }}><p style={{ fontWeight: 700, fontSize: "0.875rem", color: rideType === type ? "var(--brand-dark)" : "var(--text-primary)" }}>{distance ? `₹${Math.round(base + per * distance)}` : `₹${base}+`}</p><p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>₹{per}/km</p></div>
                  </button>
                ))}
              </div>
            </div>
            {(rideType === "car" || rideType === "auto") && (
              <div>
                <label className="rw-label">Pool Option</label>
                <button type="button" onClick={() => setInstantPool(!instantPool)} style={{
                  display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 14px",
                  borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left",
                  background: instantPool ? "#F0FDF4" : "var(--bg-secondary)",
                  border: instantPool ? "2px solid #22C55E" : "2px solid transparent",
                  color: "var(--text-primary)", transition: "all 0.15s",
                }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "4px", flexShrink: 0, background: instantPool ? "#22C55E" : "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {instantPool && <CheckCircle size={16} color="white" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}><Users size={15} /> Instant Pool Match</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Save up to 30% — matched with riders heading the same way</p>
                  </div>
                  {instantPool && distance > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 800, fontSize: "0.9rem", color: "#16A34A" }}>₹{poolFare}~</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textDecoration: "line-through" }}>₹{fare}</p>
                    </div>
                  )}
                </button>
              </div>
            )}
            <div>
              <label className="rw-label">Payment Method</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
                {[{ val: "cash", label: "Cash", Icon: Banknote }, { val: "online", label: "Online", Icon: CreditCard }].map(({ val, label, Icon }) => (
                  <button key={val} type="button" onClick={() => setPaymentMethod(val)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 14px", borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: "0.875rem", background: paymentMethod === val ? "var(--brand-light)" : "var(--bg-secondary)", border: paymentMethod === val ? "2px solid var(--brand)" : "2px solid transparent", color: paymentMethod === val ? "var(--brand-dark)" : "var(--text-primary)" }}><Icon size={16} />{label}</button>
                ))}
              </div>
            </div>
            {fare > 0 && (
              <div style={{ background: instantPool ? "#F0FDF4" : "var(--brand-light)", borderRadius: "10px", padding: "14px 16px", borderLeft: instantPool ? "4px solid #22C55E" : "4px solid var(--brand)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}><span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Distance</span><span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.85rem" }}>{distance} km</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{instantPool ? "Pool Fare (if matched)" : "Estimated Fare"}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: instantPool ? "#16A34A" : "var(--brand-dark)", fontWeight: 800, fontSize: "1.25rem" }}>₹{instantPool ? poolFare : fare}</span>
                    {instantPool && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "line-through", marginLeft: "8px" }}>₹{fare}</span>}
                  </div>
                </div>
              </div>
            )}
            <button className="rw-btn-primary" onClick={handleSubmit} disabled={loading || !pickup || !dropoff} data-loading={loading ? "true" : undefined} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? <span className="rw-spinner" aria-hidden="true" /> : instantPool ? <Users size={16} /> : <Navigation size={16} />}
              {loading ? "Booking..." : instantPool ? "Find pool match" : "Book now"}
            </button>
          </div>
          <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border)", height: "600px", position: "sticky", top: "80px", boxShadow: "var(--shadow-sm)" }} className="rw-book-map">
            <MapComponent pickupCoords={pickup} dropoffCoords={dropoff} height="100%" activeField={activeField} onPickupChange={handlePickupChange} onDropoffChange={handleDropoffChange} />
          </div>
        </div>
      </div>
      {/* Responsive toggle */}
      <style>{`
        @media (max-width: 767px) {
          .rw-mobile-booking { display: block !important; }
          .rw-desktop-booking { display: none !important; }
        }
        @media (min-width: 768px) {
          .rw-mobile-booking { display: none !important; }
          .rw-desktop-booking { display: block !important; }
        }
      `}</style>
    </div>
  );
};
export default BookRide;
