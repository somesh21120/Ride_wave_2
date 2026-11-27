import { useRef, useState, useEffect } from "react";
import { MapPin, Locate, Loader } from "lucide-react";
import { searchPlaces, reverseGeocode } from "../services/geocode";

const PlacesAutocomplete = ({ placeholder, onPlaceSelect, isPickup = false, value }) => {
  const inputRef = useRef(null);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (inputRef.current && typeof value?.address === "string") setQuery(value.address);
  }, [value?.address]);

  // Debounced address search against Nominatim.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchPlaces(query);
        setResults(res);
        setOpen(true);
      } catch { setResults([]); }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const selectResult = (r) => {
    setQuery(r.address);
    setResults([]);
    setOpen(false);
    onPlaceSelect(r);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords: { latitude: lat, longitude: lng } }) => {
      try {
        const address = await reverseGeocode(lat, lng);
        setQuery(address);
        onPlaceSelect({ address, lat, lng });
      } catch { }
      setLocating(false);
    }, () => setLocating(false));
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="rw-input"
            style={{ paddingLeft: "38px" }}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
          />
          <MapPin size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: isPickup ? "var(--success)" : "#EF4444", pointerEvents: "none" }} />
        </div>
        {isPickup && (
          <button type="button" onClick={handleGeolocate} disabled={locating} title="Use my location"
            style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: "10px", width: "44px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            onMouseOver={e => e.currentTarget.style.borderColor = "var(--brand)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
            {locating ? <Loader size={16} color="var(--brand)" style={{ animation: "spin 1s linear infinite" }} /> : <Locate size={16} color="var(--brand)" />}
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", boxShadow: "var(--shadow-lg)", zIndex: 2000, maxHeight: "240px", overflowY: "auto", marginTop: "4px" }}>
          {results.map((r, i) => (
            <div key={i} onMouseDown={(e) => { e.preventDefault(); selectResult(r); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-primary)", borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none" }}>
              {r.address}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default PlacesAutocomplete;
