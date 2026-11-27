import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { Clock, MapPin } from "lucide-react";
import api from "../services/api";
import { ShareTrip } from "../components/illustrations";
import "leaflet/dist/leaflet.css";

// Leaflet draws with SVG attributes, which cannot read CSS variables: use the palette hex values.
const PICKUP = "#0F766E";
const DROP = "#B08D57";
const DRIVER = "#2563EB";
const STATUS_TEXT = { accepted: "Driver on the way", ongoing: "On the trip", completed: "Trip completed", requested: "Finding a driver" };

const TripShare = () => {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/public/trip/${token}`);
        setTrip(data);
      } catch (e) {
        setError(e?.response?.data?.message || "This trip link has expired.");
      }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [token]);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: "24px" }}>
        <div className="rw-fade-up" style={{ textAlign: "center", maxWidth: "360px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ShareTrip width={150} />
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.8rem", margin: "12px 0 8px", color: "var(--text-primary)" }}>This trip link has ended</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>{error} Links stop working when the ride ends or is cancelled.</p>
          <Link to="/" className="rw-btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>Go to RideWave</Link>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <div className="rw-skeleton" style={{ height: "40vh", minHeight: "280px", borderRadius: 0 }} />
        <div style={{ padding: "20px", maxWidth: "420px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="rw-skeleton" style={{ height: "22px", width: "40%" }} />
          <div className="rw-skeleton" style={{ height: "18px", width: "70%" }} />
          <div className="rw-skeleton" style={{ height: "18px", width: "90%" }} />
        </div>
      </div>
    );
  }

  const center = trip.pickup ? [trip.pickup.lat, trip.pickup.lng] : [20.5937, 78.9629];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ height: "40vh", minHeight: "280px" }}>
        <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%" }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {trip.pickup && (
            <CircleMarker center={[trip.pickup.lat, trip.pickup.lng]} radius={8} pathOptions={{ color: "#fff", weight: 3, fillColor: PICKUP, fillOpacity: 1 }}>
              <Tooltip>Pickup</Tooltip>
            </CircleMarker>
          )}
          {trip.dropoff && (
            <CircleMarker center={[trip.dropoff.lat, trip.dropoff.lng]} radius={8} pathOptions={{ color: "#fff", weight: 3, fillColor: DROP, fillOpacity: 1 }}>
              <Tooltip>Drop-off</Tooltip>
            </CircleMarker>
          )}
          {trip.driverLocation && (
            <>
              <CircleMarker center={[trip.driverLocation.lat, trip.driverLocation.lng]} radius={18} pathOptions={{ color: DRIVER, weight: 0, fillColor: DRIVER, fillOpacity: 0.15 }} />
              <CircleMarker center={[trip.driverLocation.lat, trip.driverLocation.lng]} radius={7} pathOptions={{ color: "#fff", weight: 3, fillColor: DRIVER, fillOpacity: 1 }}>
                <Tooltip>Driver</Tooltip>
              </CircleMarker>
            </>
          )}
        </MapContainer>
      </div>
      <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
        <p className="rw-section-title" style={{ marginBottom: "6px" }}>Shared RideWave trip · live</p>
        <span className="rw-badge" style={{ background: "var(--brand-light)", color: "var(--brand)", marginBottom: "12px", display: "inline-flex" }}>
          {STATUS_TEXT[trip.status] || trip.status}
        </span>
        <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "4px" }}>
          {trip.driver?.firstName || "Driver"} · {trip.rideType}
        </h2>
        {trip.driver?.vehicleModel && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
            {trip.driver.vehicleModel} · {trip.driver.vehicleNumber}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <MapPin size={14} color={PICKUP} style={{ marginTop: "2px" }} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{trip.pickup?.address}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <MapPin size={14} color={DROP} style={{ marginTop: "2px" }} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{trip.dropoff?.address}</p>
          </div>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "16px", display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock size={12} /> Updates every 10 seconds · last change {new Date(trip.updatedAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
export default TripShare;