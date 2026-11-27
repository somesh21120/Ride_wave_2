import { useEffect, useState } from "react";
import { Home, Briefcase, GraduationCap, Star } from "lucide-react";
import { loadSavedPlaces, subscribeSavedPlaces } from "./savedPlacesStore";

const iconFor = (label = "") => {
  const l = label.toLowerCase();
  if (l.includes("home")) return Home;
  if (l.includes("work") || l.includes("office")) return Briefcase;
  if (l.includes("college") || l.includes("school") || l.includes("university")) return GraduationCap;
  return Star;
};

/**
 * One-tap saved places (Home, Work, College...) shown above a location input.
 * onSelect receives { address, lat, lng }: the same shape as a search result.
 * Renders nothing when the user has no saved places.
 */
const SavedPlaceChips = ({ onSelect, selected }) => {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    let alive = true;
    loadSavedPlaces().then((list) => { if (alive) setPlaces(list || []); });
    const unsub = subscribeSavedPlaces((list) => { if (alive) setPlaces(list); });
    return () => { alive = false; unsub(); };
  }, []);

  if (!places.length) return null;

  return (
    <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "6px", WebkitOverflowScrolling: "touch" }} aria-label="Saved places">
      {places.map((p, i) => {
        const Icon = iconFor(p.label);
        const active = selected && selected.lat === p.lat && selected.lng === p.lng;
        return (
          <button
            key={`${p.label}-${i}`}
            type="button"
            onClick={() => onSelect({ address: p.address, lat: p.lat, lng: p.lng })}
            title={p.address}
            style={{
              display: "flex", alignItems: "center", gap: "5px", flexShrink: 0,
              minHeight: "36px", padding: "6px 12px", borderRadius: "999px", cursor: "pointer",
              border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
              background: active ? "var(--brand-light)" : "var(--bg-primary)",
              color: active ? "var(--brand-dark)" : "var(--text-primary)",
              fontSize: "0.8rem", fontWeight: 600, fontFamily: "var(--font-sans)",
            }}
          >
            <Icon size={13} /> {p.label}
          </button>
        );
      })}
    </div>
  );
};

export default SavedPlaceChips;
