import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { MousePointerClick } from "lucide-react";
import { reverseGeocode, getRoute } from "../services/geocode";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icon paths (broken under bundlers).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const INDIA_CENTER = [20.5937, 78.9629];

const pickupIcon = new L.DivIcon({ className: "", html: '<div style="width:16px;height:16px;border-radius:50%;background:#10B981;border:3px solid #fff;box-shadow:0 0 0 2px #10B981;"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
const dropoffIcon = new L.DivIcon({ className: "", html: '<div style="width:16px;height:16px;border-radius:50%;background:#EF4444;border:3px solid #fff;box-shadow:0 0 0 2px #EF4444;"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

// Inner component to access the Leaflet map instance (setView on changes).
const Recenter = ({ center, pickupCoords, dropoffCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      const bounds = L.latLngBounds(
        [pickupCoords.lat, pickupCoords.lng],
        [dropoffCoords.lat, dropoffCoords.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, pickupCoords, dropoffCoords, map]);
  return null;
};

const MapComponent = ({ pickupCoords, dropoffCoords, height = "100%", activeField, onPickupChange, onDropoffChange }) => {
  const [center, setCenter] = useState(INDIA_CENTER);
  const [route, setRoute] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const pickEnabled = !!(onPickupChange || onDropoffChange);

  // Load route when both points set.
  useEffect(() => {
    let cancelled = false;
    if (pickupCoords && dropoffCoords) {
      getRoute(pickupCoords, dropoffCoords).then((r) => { if (!cancelled) setRoute(r?.points || null); });
    } else {
      setRoute(null);
      if (pickupCoords) setCenter([pickupCoords.lat, pickupCoords.lng]);
    }
    return () => { cancelled = true; };
  }, [pickupCoords, dropoffCoords]);

  // Center on user location initially.
  useEffect(() => {
    if (!pickupCoords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => setCenter([p.coords.latitude, p.coords.longitude]));
    }
  }, []);

  const applyPick = useCallback(async (lat, lng, target) => {
    setGeocoding(true);
    const address = await reverseGeocode(lat, lng);
    setGeocoding(false);
    const loc = { lat, lng, address };
    if (target === "dropoff") onDropoffChange?.(loc);
    else onPickupChange?.(loc);
  }, [onPickupChange, onDropoffChange]);

  const handleMapClick = (e) => {
    if (!pickEnabled) return;
    const { lat, lng } = e.latlng;
    const target = activeField === "dropoff" && onDropoffChange ? "dropoff" : (onPickupChange ? "pickup" : "dropoff");
    applyPick(lat, lng, target);
  };

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%", borderRadius: "var(--radius-lg)" }} onClick={handleMapClick}
        zoomControl={true} attributionControl={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Recenter center={center} pickupCoords={pickupCoords} dropoffCoords={dropoffCoords} />
        {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon} draggable={!!onPickupChange} eventHandlers={{ dragend: (e) => { const { lat, lng } = e.target.getLatLng(); applyPick(lat, lng, "pickup"); } }} />}
        {dropoffCoords && <Marker position={[dropoffCoords.lat, dropoffCoords.lng]} icon={dropoffIcon} draggable={!!onDropoffChange} eventHandlers={{ dragend: (e) => { const { lat, lng } = e.target.getLatLng(); applyPick(lat, lng, "dropoff"); } }} />}
        {route && <Polyline positions={route} pathOptions={{ color: "var(--brand)", weight: 5, opacity: 0.9 }} />}
      </MapContainer>
      {pickEnabled && (
        <div style={{ position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "20px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", boxShadow: "var(--shadow-md)", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", pointerEvents: "none", zIndex: 1000 }}>
          <MousePointerClick size={13} color="var(--brand)" />
          {geocoding ? "Finding address..." : `Click map to set ${activeField === "dropoff" ? "dropoff" : "pickup"} · drag pins to adjust`}
        </div>
      )}
    </div>
  );
};
export default MapComponent;
