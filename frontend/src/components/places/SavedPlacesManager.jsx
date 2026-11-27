import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import api from "../../services/api";
import PlacesAutocomplete from "../PlacesAutocomplete";
import { useToast } from "../../context/ToastContext";
import { loadSavedPlaces, setSavedPlacesCache, subscribeSavedPlaces } from "./savedPlacesStore";
import EmptyState from "../ui/EmptyState";
import { EmptySavedPlaces } from "../illustrations";

const MAX_PLACES = 5;
const SUGGESTED = ["Home", "Work", "College"];

/**
 * Profile section: add, rename and delete saved places (roadmap A7).
 * Uses /api/auth/places; every response returns the full updated list.
 */
const SavedPlacesManager = () => {
  const toast = useToast();
  const [places, setPlaces] = useState([]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState(null);
  const [editIndex, setEditIndex] = useState(-1);
  const [editLabel, setEditLabel] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadSavedPlaces(true).then((list) => { if (alive) setPlaces(list || []); });
    const unsub = subscribeSavedPlaces((list) => { if (alive) setPlaces(list); });
    return () => { alive = false; unsub(); };
  }, []);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const { data } = await fn();
      setSavedPlacesCache(data);
      if (okMsg) toast(okMsg, "success");
      return true;
    } catch (err) {
      toast(err?.response?.data?.message || "Could not update saved places", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    const name = label.trim();
    if (!name) return toast("Give the place a name, for example Home", "error");
    if (!location) return toast("Search and pick an address first", "error");
    const ok = await run(() => api.post("/auth/places", { label: name, address: location.address, lat: location.lat, lng: location.lng }), `${name} saved`);
    if (ok) { setAdding(false); setLabel(""); setLocation(null); }
  };

  const rename = async (i) => {
    const name = editLabel.trim();
    if (!name) return;
    const ok = await run(() => api.put(`/auth/places/${i}`, { label: name }), "Place renamed");
    if (ok) setEditIndex(-1);
  };

  const remove = (i) => run(() => api.delete(`/auth/places/${i}`), "Place removed");

  const unusedSuggestions = SUGGESTED.filter((s) => !places.some((p) => p.label.toLowerCase() === s.toLowerCase()));

  return (
    <div className="rw-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MapPin size={18} color="var(--text-secondary)" />
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Saved places</h2>
        </div>
        {!adding && places.length < MAX_PLACES && (
          <button type="button" className="rw-btn-secondary" onClick={() => setAdding(true)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
            <Plus size={15} /> Add place
          </button>
        )}
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "14px" }}>
        Save up to {MAX_PLACES} places. They appear as one-tap shortcuts when you book a ride.
      </p>

      {places.length === 0 && !adding && (
        <EmptyState illustration={EmptySavedPlaces} width={130} compact title="No saved places yet" text="Add Home, Work or College to book faster." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {places.map((p, i) => (
          <div key={`${p.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px", minWidth: 0 }}>
              {editIndex === i ? (
                <input className="rw-input" value={editLabel} maxLength={30} onChange={(e) => setEditLabel(e.target.value)} aria-label="Place name" autoFocus />
              ) : (
                <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{p.label}</p>
              )}
              <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.address}>{p.address}</p>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {editIndex === i ? (
                <>
                  <button type="button" disabled={busy} onClick={() => rename(i)} aria-label="Save name" className="rw-icon-btn"><Check size={16} /></button>
                  <button type="button" onClick={() => setEditIndex(-1)} aria-label="Cancel" className="rw-icon-btn"><X size={16} /></button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => { setEditIndex(i); setEditLabel(p.label); }} aria-label={`Rename ${p.label}`} className="rw-icon-btn"><Edit2 size={15} /></button>
                  <button type="button" disabled={busy} onClick={() => remove(i)} aria-label={`Delete ${p.label}`} className="rw-icon-btn" style={{ color: "#DC2626" }}><Trash2 size={15} /></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <div style={{ marginTop: "12px", padding: "14px", background: "var(--bg-secondary)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div>
            <label className="rw-label">Name</label>
            <input className="rw-input" placeholder="Home, Work, College..." value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} />
            {unusedSuggestions.length > 0 && (
              <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                {unusedSuggestions.map((s) => (
                  <button key={s} type="button" onClick={() => setLabel(s)} style={{ border: "1px solid var(--border)", background: "var(--bg-primary)", borderRadius: "999px", padding: "4px 10px", fontSize: "0.75rem", cursor: "pointer", color: "var(--text-secondary)" }}>{s}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="rw-label">Address</label>
            <PlacesAutocomplete placeholder="Search address..." onPlaceSelect={setLocation} value={location} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="rw-btn-secondary" style={{ flex: 1 }} onClick={() => { setAdding(false); setLabel(""); setLocation(null); }}>Cancel</button>
            <button type="button" className="rw-btn-primary" style={{ flex: 1 }} disabled={busy} onClick={add}>{busy ? "Saving..." : "Save place"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedPlacesManager;
