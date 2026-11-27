import { createContext, useContext } from "react";

// No external loader needed: OpenStreetMap/Leaflet requires no API key.
const MapsContext = createContext({ isLoaded: true });

export const MapsProvider = ({ children }) => {
  return <MapsContext.Provider value={{ isLoaded: true }}>{children}</MapsContext.Provider>;
};

export const useMaps = () => useContext(MapsContext);
