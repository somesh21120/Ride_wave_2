// Free OpenStreetMap geocoding & routing helpers (no API key required).
// - Nominatim: address search + reverse geocoding
// - OSRM: driving route between two coordinates

const NOMINATIM = "https://nominatim.openstreetmap.org";

// Search for places by text query. Returns array of { address, lat, lng }.
export const searchPlaces = async (query) => {
  const url = `${NOMINATIM}/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.map((r) => ({
    address: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
};

// Reverse geocode coordinates to a human-readable address.
export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();
    if (data?.display_name) return data.display_name;
  } catch { /* fall through */ }
  return `Dropped pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
};

// Get a driving route polyline between two points via OSRM.
// Returns { points, distanceKm } or null if no valid route found.
export const getRoute = async (from, to) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const points = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    // OSRM distance is in meters
    const distanceKm = data.routes[0].distance / 1000;
    return { points, distanceKm };
  } catch {
    return null;
  }
};
