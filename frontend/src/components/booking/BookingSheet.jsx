import { useState, useRef, useCallback, useEffect } from "react";
import { Bike, Car, CheckCircle, CreditCard, Banknote, Navigation, MapPin, Users, GripHorizontal, User } from "lucide-react";
import PlacesAutocomplete from "../PlacesAutocomplete";
import SavedPlaceChips from "../places/SavedPlaceChips";

const RIDE_TYPES = [
  { type: "bike", label: "Bike", Icon: Bike, desc: "Fastest & cheapest", seats: 1, base: 20, per: 8 },
  { type: "auto", label: "Auto", Icon: Car, desc: "Comfortable ride", seats: 3, base: 30, per: 12 },
  { type: "car", label: "Car", Icon: Car, desc: "Premium experience", seats: 4, base: 50, per: 18 },
];

const BookingSheet = ({
  pickup, dropoff, activeField, rideType, paymentMethod, instantPool,
  distance, fare, poolFare, loading,
  onPickupChange, onDropoffChange, setActiveField, setRideType, setPaymentMethod,
  setInstantPool, onSubmit,
}) => {
  const [sheetHeight, setSheetHeight] = useState("peek");
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const heights = { peek: "30%", half: "55%", full: "90%" };
  const order = ["peek", "half", "full"];

  const snapTo = useCallback((snap) => {
    setSheetHeight(snap);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 0.3s ease";
      sheetRef.current.style.height = heights[snap];
      setTimeout(() => {
        if (sheetRef.current) sheetRef.current.style.transition = "";
      }, 300);
    }
  }, []);

  const cycleHeight = useCallback(() => {
    setSheetHeight((prev) => {
      const idx = order.indexOf(prev);
      const next = order[(idx + 1) % order.length];
      if (sheetRef.current) {
        sheetRef.current.style.transition = "height 0.3s ease";
        sheetRef.current.style.height = heights[next];
        setTimeout(() => {
          if (sheetRef.current) sheetRef.current.style.transition = "";
        }, 300);
      }
      return next;
    });
  }, []);

  const handleTouchStart = useCallback((e) => {
    startY.current = e.touches[0].clientY;
    const sheet = sheetRef.current;
    if (sheet) {
      const h = parseFloat(sheet.style.height) || 30;
      startHeight.current = h;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    const delta = startY.current - e.touches[0].clientY;
    const newH = Math.max(25, Math.min(95, startHeight.current + (delta / window.innerHeight) * 100));
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.height = `${newH}%`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const h = parseFloat(sheet.style.height) || 30;
    let snap;
    if (h < 40) snap = "peek";
    else if (h < 70) snap = "half";
    else snap = "full";
    snapTo(snap);
  }, [snapTo]);

  useEffect(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 0.3s ease";
      sheetRef.current.style.height = heights[sheetHeight];
      setTimeout(() => {
        if (sheetRef.current) sheetRef.current.style.transition = "";
      }, 300);
    }
  }, [sheetHeight]);

  return (
    <div
      ref={sheetRef}
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: heights[sheetHeight],
        background: "var(--bg-card)",
        borderTopLeftRadius: "var(--radius-xl)",
        borderTopRightRadius: "var(--radius-xl)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        zIndex: 1000,
        display: "flex", flexDirection: "column",
        transition: "height 0.3s ease",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        overflow: "hidden",
      }}
    >
      {/* Drag handle */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={cycleHeight}
        style={{
          display: "flex", justifyContent: "center", padding: "8px 0 4px",
          cursor: "grab", touchAction: "none", flexShrink: 0,
        }}
      >
        <GripHorizontal size={24} color="var(--text-muted)" />
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Pickup & Dropoff */}
        <div style={{ background: "var(--bg-secondary)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label className="rw-label" style={{ margin: 0 }}>Pickup</label>
              <button type="button" onClick={() => setActiveField("pickup")} style={{
                display: "flex", alignItems: "center", gap: "4px",
                background: activeField === "pickup" ? "var(--brand-light)" : "transparent",
                border: activeField === "pickup" ? "1px solid var(--brand)" : "1px solid var(--border)",
                borderRadius: "20px", padding: "3px 10px", cursor: "pointer",
                fontSize: "0.72rem", fontWeight: 600,
                color: activeField === "pickup" ? "var(--brand-dark)" : "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}><MapPin size={11} /> Set on map</button>
            </div>
            <SavedPlaceChips onSelect={onPickupChange} selected={pickup} />
            <PlacesAutocomplete placeholder="Search pickup..." onPlaceSelect={onPickupChange} isPickup={true} value={pickup} />
            {pickup && <p style={{ color: "var(--success)", fontSize: "0.72rem", marginTop: "3px", display: "flex", alignItems: "center", gap: "3px" }}><CheckCircle size={11} /> {pickup.address}</p>}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label className="rw-label" style={{ margin: 0 }}>Dropoff</label>
              <button type="button" onClick={() => setActiveField("dropoff")} style={{
                display: "flex", alignItems: "center", gap: "4px",
                background: activeField === "dropoff" ? "var(--brand-light)" : "transparent",
                border: activeField === "dropoff" ? "1px solid var(--brand)" : "1px solid var(--border)",
                borderRadius: "20px", padding: "3px 10px", cursor: "pointer",
                fontSize: "0.72rem", fontWeight: 600,
                color: activeField === "dropoff" ? "var(--brand-dark)" : "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}><Navigation size={11} /> Set on map</button>
            </div>
            <SavedPlaceChips onSelect={onDropoffChange} selected={dropoff} />
            <PlacesAutocomplete placeholder="Search dropoff..." onPlaceSelect={onDropoffChange} isPickup={false} value={dropoff} />
            {dropoff && <p style={{ color: "var(--danger)", fontSize: "0.72rem", marginTop: "3px", display: "flex", alignItems: "center", gap: "3px" }}><CheckCircle size={11} /> {dropoff.address}</p>}
          </div>
        </div>

        {/* Ride Type */}
        <div>
          <label className="rw-label">Ride Type</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
            {RIDE_TYPES.map(({ type, label, Icon, desc, seats, base, per }) => (
              <button key={type} type="button" onClick={() => setRideType(type)} style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px",
                borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-sans)",
                textAlign: "left", minHeight: "44px",
                background: rideType === type ? "var(--brand-light)" : "var(--bg-secondary)",
                border: rideType === type ? "2px solid var(--brand)" : "2px solid transparent",
              }}>
                <div style={{
                  background: rideType === type ? "var(--brand)" : "var(--border)",
                  borderRadius: "8px", width: "36px", height: "36px",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}><Icon size={18} color={rideType === type ? "#0F172A" : "var(--text-secondary)"} /></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>{label}</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px" }}>
                    <User size={11} /> {seats} seat{seats > 1 ? "s" : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", color: rideType === type ? "var(--brand-dark)" : "var(--text-primary)" }}>
                    {distance ? `₹${Math.round(base + per * distance)}` : `₹${base}+`}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>₹{per}/km</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pool toggle */}
        {(rideType === "car" || rideType === "auto") && (
          <div>
            <label className="rw-label">Pool Option</label>
            <button type="button" onClick={() => setInstantPool(!instantPool)} style={{
              display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 12px",
              borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left",
              minHeight: "44px",
              background: instantPool ? "#F0FDF4" : "var(--bg-secondary)",
              border: instantPool ? "2px solid #22C55E" : "2px solid transparent",
              color: "var(--text-primary)", transition: "all 0.15s",
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "4px", flexShrink: 0,
                background: instantPool ? "#22C55E" : "var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {instantPool && <CheckCircle size={16} color="white" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users size={14} /> Instant Pool Match
                </p>
                <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Save up to 30% — matched with riders heading the same way</p>
              </div>
              {instantPool && distance > 0 && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 800, fontSize: "0.85rem", color: "#16A34A" }}>₹{poolFare}~</p>
                  <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", textDecoration: "line-through" }}>₹{fare}</p>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Payment */}
        <div>
          <label className="rw-label">Payment Method</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
            {[{ val: "cash", label: "Cash", Icon: Banknote }, { val: "online", label: "Online", Icon: CreditCard }].map(({ val, label, Icon }) => (
              <button key={val} type="button" onClick={() => setPaymentMethod(val)} style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "11px 14px",
                borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-sans)",
                fontWeight: 600, fontSize: "0.85rem", minHeight: "44px",
                background: paymentMethod === val ? "var(--brand-light)" : "var(--bg-secondary)",
                border: paymentMethod === val ? "2px solid var(--brand)" : "2px solid transparent",
                color: paymentMethod === val ? "var(--brand-dark)" : "var(--text-primary)",
              }}><Icon size={16} />{label}</button>
            ))}
          </div>
        </div>

        {/* Fare summary */}
        {fare > 0 && (
          <div style={{
            background: instantPool ? "#F0FDF4" : "var(--brand-light)",
            borderRadius: "10px", padding: "12px 14px",
            borderLeft: instantPool ? "4px solid #22C55E" : "4px solid var(--brand)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Distance</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.8rem" }}>{distance} km</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                {instantPool ? "Pool Fare (if matched)" : "Estimated Fare"}
              </span>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: instantPool ? "#16A34A" : "var(--brand-dark)", fontWeight: 800, fontSize: "1.1rem" }}>
                  ₹{instantPool ? poolFare : fare}
                </span>
                {instantPool && (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", textDecoration: "line-through", marginLeft: "6px" }}>₹{fare}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Confirm button */}
      <div style={{ flexShrink: 0, padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <button
          className="rw-btn-primary"
          onClick={onSubmit}
          disabled={loading || !pickup || !dropoff}
          data-loading={loading ? "true" : undefined}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {loading && <span className="rw-spinner" aria-hidden="true" />}
          {instantPool ? <Users size={16} /> : <Navigation size={16} />}
          {loading ? "Booking..." : instantPool ? "Find pool match" : "Confirm ride"}
        </button>
      </div>
    </div>
  );
};

export default BookingSheet;