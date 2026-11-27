// Free OpenStreetMap geocoding & routing helpers (no API key required).
// - Nominatim: address search + reverse geocoding
// - OSRM: driving route between two coordinates

const NOMINATIM = "https://nominatim.openstreetmap.org";

// Clean up a Nominatim display_name into a short, readable address.
// Takes the result object and returns { short, full }.
const cleanAddress = (r) => {
  const parts = (r.display_name || "").split(",").map((s) => s.trim());
  // Remove the country ("India") from the tail if present
  if (parts[parts.length - 1]?.toLowerCase() === "india") parts.pop();
  // Remove state if present (e.g. "Gujarat")
  if (parts.length > 2 && /^(Gujarat|Maharashtra|Rajasthan|Madhya Pradesh|Uttar Pradesh|Tamil Nadu|Karnataka|Kerala|Andhra Pradesh|Telangana|West Bengal|Bihar|Odisha|Punjab|Haryana|Delhi|Chandigarh)$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }
  const short = parts.slice(0, Math.min(3, parts.length)).join(", ");
  return { short, full: parts.join(", ") };
};

// Type labels for OSM result categories
const TYPE_LABELS = {
  restaurant: "Restaurant", hotel: "Hotel", hospital: "Hospital", school: "School",
  university: "University", college: "College", mall: "Mall", park: "Park",
  station: "Station", airport: "Airport", bus_stop: "Bus Stop", railway: "Railway Station",
  supermarket: "Supermarket", bank: "Bank", atm: "ATM", pharmacy: "Pharmacy",
  police: "Police Station", fire_station: "Fire Station", post_office: "Post Office",
  cinema: "Cinema", theatre: "Theatre", library: "Library", stadium: "Stadium",
  place_of_worship: "Place of Worship", temple: "Temple", mosque: "Mosque", church: "Church",
  hostel: "Hostel", guest_house: "Guest House", museum: "Museum",
  office: "Office", company: "Company", cafe: "Cafe", food: "Food",
  residential: "Residential Area", suburb: "Suburb", neighbourhood: "Neighbourhood",
  town: "Town", city: "City", village: "Village",
  road: "Road", street: "Street", highway: "Highway",
};

const getTypeLabel = (r) => {
  return TYPE_LABELS[r.type] || TYPE_LABELS[r.category] || r.type || r.category || "Place";
};

// Search for places — restricted to India, biased towards Rajkot, Gujarat.
// Returns array of { address, shortAddress, lat, lng, type }.
export const searchPlaces = async (query) => {
  // viewbox biases results to Rajkot + surrounding Gujarat region
  const url = `${NOMINATIM}/search?format=json&limit=5&countrycodes=in&bounded=1&viewbox=69.5,23.5,71.5,21.5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.map((r) => {
    const { short, full } = cleanAddress(r);
    return {
      address: full,
      shortAddress: short,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      type: getTypeLabel(r),
    };
  });
};

// Reverse geocode coordinates to a human-readable address.
export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();
    if (data?.display_name) {
      const { full } = cleanAddress(data);
      return full;
    }
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
