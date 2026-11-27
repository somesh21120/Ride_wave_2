import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Phone, User, Car, Clock, Ban, Share2, ShieldAlert, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import SosSheet from "./safety/SosSheet";
import StatusStepper from "./trip/StatusStepper";
import OtpCard from "./trip/OtpCard";
import PoolCard from "./trip/PoolCard";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const driverIcon = new L.DivIcon({
  className: "rw-driver-marker",
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 2px #2563EB;"></div>',
  iconSize: [18, 18], iconAnchor: [9, 9],
});
const pickupIcon = new L.DivIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#0F766E;border:3px solid #fff;box-shadow:0 0 0 2px #0F766E;"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8],
});
const dropoffIcon = new L.DivIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#B08D57;border:3px solid #fff;box-shadow:0 0 0 2px #B08D57;"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8],
});

const Recenter = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom(), { animate: true }); }, [center, map]);
  return null;
};

const getDistance = (p, d) => {
  if (!p || !d) return null;
  const dLat = ((d.lat - p.lat) * Math.PI) / 180, dLon = ((d.lng - p.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((p.lat * Math.PI) / 180) * Math.cos((d.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

const DriverEnRoute = ({ ride, role, onStartRide, onCancel, actionLoading }) => {
  const { driverLocations, emitDriverLocation } = useSocket();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const [mapCenter, setMapCenter] = useState(
    ride?.pickupLocation ? [ride.pickupLocation.lat, ride.pickupLocation.lng] : [20.5937, 78.9629]
  );
  const watchIdRef = useRef(null);
  const [otpInput, setOtpInput] = useState("");
  const [showSos, setShowSos] = useState(false);
  const [coOtpInputs, setCoOtpInputs] = useState({});

  const driverLoc = ride?.driver?._id ? driverLocations[ride.driver._id] : null;
  const isDriver = role === "driver";

  // Watch position for both accepted and ongoing
  useEffect(() => {
    if (!isDriver || !ride || (ride.status !== "accepted" && ride.status !== "ongoing")) return;
    if (!navigator.geolocation) return;
    const success = (pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      emitDriverLocation(ride.driver._id, loc);
    };
    watchIdRef.current = navigator.geolocation.watchPosition(success, null, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 5000,
    });
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isDriver, ride?._id, ride?.status]);

  // ETA label & center target
  const etaLabel = ride.status === "ongoing" ? (isDriver ? "min to destination" : "min to destination") : (isDriver ? "min to first pickup" : "min to pickup");
  const mapTarget = ride.status === "ongoing" ? ride.dropoffLocation : ride.pickupLocation;
  // Driver's vehicle (populated by the API) for the passenger's "Driver on the way" card.
  // v1 referenced an undefined variable here, which crashed My Rides once a driver accepted.
  const vehicleInfo = ride?.driver?.vehicle || null;
  // Straight-line ETA at an average city speed of 25 km/h (min 1 minute).
  // Upgrade path (roadmap A2): replace with OSRM road distance/duration.
  const CITY_SPEED_KMPH = 25;
  const distKm = getDistance(driverLoc, mapTarget);
  const eta = distKm === null ? null : Math.max(1, Math.round((distKm / CITY_SPEED_KMPH) * 60));
  // Stepper position: "arriving" once the driver is within about 3 minutes of the pickup
  const stepStatus = ride.status === "accepted" && eta !== null && eta <= 3 ? "arriving" : ride.status;
  // Pool details for this rider (main passenger or a co-rider)
  const myCoRide = (ride.coRiders || []).find((c) => String(c.user?._id || c.user) === String(user?._id || ""));
  const isPool = ride.rideCategory === "pool" || (ride.coRiders || []).length > 0;

  // Center map
  useEffect(() => {
    if (driverLoc && mapTarget) {
      setMapCenter([(driverLoc.lat + mapTarget.lat) / 2, (driverLoc.lng + mapTarget.lng) / 2]);
    } else if (mapTarget) {
      setMapCenter([mapTarget.lat, mapTarget.lng]);
    }
  }, [driverLoc, mapTarget]);
  const driverName = isDriver ? ride?.passenger?.name : ride?.driver?.name || ride?.driver?.name;
  const driverPhone = isDriver ? ride?.passenger?.phone : ride?.driver?.phone;
  const pickupLabel = isDriver ? "Pickup Location" : "Your Pickup";
  const dropoffLabel = isDriver ? "Dropoff Location" : "Your Dropoff";

  return (
    <div className="rw-card" style={{ overflow: "hidden", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
      {/* Map */}
      <div style={{ height: "280px", position: "relative" }}>
        <MapContainer center={mapCenter} zoom={14} style={{ width: "100%", height: "100%" }} zoomControl={true} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Recenter center={mapCenter} />
          {ride.pickupLocation && <Marker position={[ride.pickupLocation.lat, ride.pickupLocation.lng]} icon={pickupIcon} />}
          {ride.dropoffLocation && <Marker position={[ride.dropoffLocation.lat, ride.dropoffLocation.lng]} icon={dropoffIcon} />}
          {driverLoc && <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverIcon} />}
          {/* Route line from driver to destination */}
          {driverLoc && ride.status === "ongoing" && ride.dropoffLocation && (
            <Polyline positions={[[driverLoc.lat, driverLoc.lng], [ride.dropoffLocation.lat, ride.dropoffLocation.lng]]} color="var(--brand)" weight={3} opacity={0.6} dashArray="8, 8" />
          )}
          {/* Route line from pickup to dropoff */}
          {ride.pickupLocation && ride.dropoffLocation && (
            <Polyline positions={[[ride.pickupLocation.lat, ride.pickupLocation.lng], [ride.dropoffLocation.lat, ride.dropoffLocation.lng]]} color="#B08D57" weight={2} opacity={0.4} />
          )}
          {/* Co-rider pickup markers */}
          {(ride.coRiders || []).filter(c => c.status === "joined" || c.status === "picked_up").map((co, i) => {
            if (!co.pickupLocation) return null;
            const coIcon = new L.DivIcon({
              className: "",
              html: `<div style="width:14px;height:14px;border-radius:50%;background:${co.status === "picked_up" ? "#10B981" : "#F59E0B"};border:2px solid #fff;box-shadow:0 0 0 2px ${co.status === "picked_up" ? "#10B981" : "#F59E0B"};display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;">${i + 1}</div>`,
              iconSize: [14, 14], iconAnchor: [7, 7],
            });
            return <Marker key={co.user?._id || i} position={[co.pickupLocation.lat, co.pickupLocation.lng]} icon={coIcon} />;
          })}
        </MapContainer>
        {/* Status overlay */}
        <div style={{ position: "absolute", top: "12px", left: "12px", background: "var(--bg-card)", borderRadius: "20px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", zIndex: 1000 }}>
          <Clock size={13} color="var(--brand)" />
          {eta !== null ? `${eta} ${etaLabel}` : (isDriver ? "Sharing your location..." : "Waiting for driver location...")}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", textTransform: "capitalize" }}>
              {ride.status === "ongoing" ? "Ride Ongoing" : (isDriver ? "Heading to Passenger" : "Driver on the Way")}
            </p>
            {!isDriver && vehicleInfo?.type && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                {vehicleInfo.type} · {vehicleInfo.number || ""} · {vehicleInfo.model || ""}
              </p>
            )}
          </div>
          <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text-primary)" }}>₹{ride.fare}</p>
        </div>

        <details className="rw-trip-steps" open>
          <summary style={{ cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>Trip progress</summary>
          <StatusStepper currentStatus={stepStatus} />
        </details>

        {/* Contact card */}
        <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: "var(--border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{driverName}</p>
            {driverPhone && (
              <a href={`tel:${driverPhone}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", color: "var(--brand)", fontSize: "0.85rem", fontWeight: 500, marginTop: "2px" }}>
                <Phone size={13} /> {driverPhone}
              </a>
            )}
          </div>
          {driverPhone && (
            <a href={`tel:${driverPhone}`} style={{ background: "var(--brand)", borderRadius: "8px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Phone size={18} color="#fff" />
            </a>
          )}
        </div>

        {/* Pickup / Dropoff */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <MapPin size={14} color="#0F766E" style={{ marginTop: "2px", flexShrink: 0 }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{pickupLabel}: {ride.pickupLocation?.address}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <Navigation size={14} color="#B08D57" style={{ marginTop: "2px", flexShrink: 0 }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{dropoffLabel}: {ride.dropoffLocation?.address}</p>
          </div>
        </div>

        {/* Ride start code (OTP): passenger sees it, driver enters it */}
        {!isDriver && ride.status === "accepted" && ride.startOtp && <OtpCard otp={ride.startOtp} />}

        {!isDriver && isPool && (
          <PoolCard
            poolMatchNote={ride.poolMatchNote}
            sharedKm={myCoRide?.sharedKm}
            savingRs={ride.poolSavings}
            coRiders={(ride.coRiders || []).length}
          />
        )}

        {isDriver && ride.status === "accepted" && (
          <div style={{ marginBottom: "10px" }}>
            <label className="rw-label" htmlFor={`otp-${ride._id}`}>Ride code from passenger</label>
            <input
              id={`otp-${ride._id}`}
              className="rw-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder="4-digit code"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              style={{ letterSpacing: "0.3em", fontWeight: 700, fontSize: "1.1rem", textAlign: "center" }}
            />
          </div>
        )}

        {/* Co-rider pickup (multi-stop corridor pool) — visible to driver during ongoing ride */}
        {isDriver && ride.status === "ongoing" && (ride.coRiders || []).filter(c => c.status === "joined").length > 0 && (
          <div style={{ marginBottom: "14px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Users size={15} color="var(--brand)" /> Co-riders to pick up
            </p>
            {(ride.coRiders || []).filter(c => c.status === "joined").map((co, i) => {
              const coId = co.user?._id || co.user;
              const val = coOtpInputs[coId] || "";
              return (
                <div key={coId} style={{ background: "var(--bg-secondary)", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px" }}>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "4px" }}>
                    Co-rider {i + 1}: {co.pickupLocation?.address?.split(",")[0] || "Unknown"}
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      className="rw-input"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Their 4-digit code"
                      value={val}
                      onChange={(e) => setCoOtpInputs({ ...coOtpInputs, [coId]: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      style={{ letterSpacing: "0.3em", fontWeight: 700, fontSize: "0.95rem", textAlign: "center", flex: 1 }}
                    />
                    <button
                      className="rw-btn-primary"
                      onClick={async () => {
                        try {
                          await api.put(`/rides/${ride._id}/pickup-corider`, { coRiderUserId: coId, otp: val });
                          toast("Co-rider picked up!", "success");
                          setCoOtpInputs({ ...coOtpInputs, [coId]: "" });
                        } catch (e) {
                          toast(e?.response?.data?.message || "Incorrect code", "error");
                        }
                      }}
                      disabled={val.length !== 4}
                      style={{ height: "44px", whiteSpace: "nowrap", fontSize: "0.78rem", padding: "0 14px" }}
                    >
                      Pick up
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {isDriver && ride.status === "accepted" && (
            <button className="rw-btn-primary" onClick={() => onStartRide(ride._id, otpInput)} disabled={!!actionLoading || otpInput.length !== 4} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              {actionLoading === ride._id + "start" ? (<><span className="rw-spinner" aria-hidden="true" /> Starting...</>) : (<><Car size={15} /> Picked up: start ride</>)}
            </button>
          )}
          {!isDriver && <button onClick={async () => {
            try {
              const { data } = await api.post(`/rides/${ride._id}/share`);
              const url = window.location.origin + "/trip/" + data.token;
              if (navigator.share) { await navigator.share({ title: "RideWave trip", url }); }
              else { await navigator.clipboard.writeText(url); toast("Trip link copied", "info"); }
            } catch { toast("Could not share trip", "error"); }
          }} className="rw-btn-ghost" style={{ fontSize: "0.8rem" }}><Share2 size={14} /> Share trip</button>}
          <button onClick={() => setShowSos(true)} className="rw-btn-danger" aria-label="SOS safety options" style={{ fontSize: "0.8rem", height: "40px", padding: "0 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}><ShieldAlert size={14} /> SOS</button>
          <button onClick={() => onCancel(ride._id)} disabled={!!actionLoading}
            className="rw-btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", borderColor: "var(--danger)", color: "var(--danger)", height: "40px", padding: "0 14px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
            <Ban size={13} />{actionLoading === ride._id + "cancel" ? "..." : "Cancel"}
          </button>
        </div>
      </div>
      {showSos && <SosSheet rideId={ride._id} canShare={!isDriver} onClose={() => setShowSos(false)} />}
    </div>
  );
};

export default DriverEnRoute;