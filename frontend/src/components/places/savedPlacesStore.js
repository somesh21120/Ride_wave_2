import api from "../../services/api";

/**
 * Tiny shared cache for the logged-in user's saved places (max 5).
 * Booking chips and the Profile manager read the same list; after any change
 * the manager calls setSavedPlacesCache so the chips update without a refetch.
 * Backend: GET/POST/PUT/DELETE /api/auth/places (see docs/API.md).
 */
let cache = null;
let inflight = null;
const listeners = new Set();

export const subscribeSavedPlaces = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export const setSavedPlacesCache = (list) => {
  cache = Array.isArray(list) ? list : [];
  listeners.forEach((fn) => fn(cache));
};

export const loadSavedPlaces = async (force = false) => {
  if (cache && !force) return cache;
  if (!inflight) {
    inflight = api.get("/auth/places")
      .then(({ data }) => { setSavedPlacesCache(data); return cache; })
      .catch(() => { setSavedPlacesCache([]); return cache; })
      .finally(() => { inflight = null; });
  }
  return inflight;
};

export const clearSavedPlacesCache = () => { cache = null; };
