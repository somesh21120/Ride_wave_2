import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { getMyRides, getAvailableRides } from "../redux/rideSlice";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// Default: connect to the same address the page came from; Vite proxies /socket.io to the backend.
// This works on the laptop, on phones over Wi-Fi and through a public tunnel link.
// Only set VITE_SOCKET_URL if the backend runs on a different address.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

export const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const [driverLocations, setDriverLocations] = useState({});
  const [connected, setConnected] = useState(false);
  // Last ride event pushed by the server. Pages can watch rideEvent.seq in a
  // useEffect to refresh themselves the moment something changes.
  const [rideEvent, setRideEvent] = useState({ seq: 0, type: null, ride: null, rideId: null });
  // Last SOS alert (admins only). Admin pages watch sosEvent.seq.
  const [sosEvent, setSosEvent] = useState({ seq: 0 });

  useEffect(() => {
    if (!user) return;
    const socket = SOCKET_URL ? io(SOCKET_URL) : io();
    socketRef.current = socket;

    const pushEvent = (type, ride, rideId) =>
      setRideEvent((prev) => ({ seq: prev.seq + 1, type, ride: ride || null, rideId: rideId || ride?._id || null }));

    socket.on("connect", () => {
      setConnected(true);
      // Join our personal room (and "drivers"/"admins") so the server can push ride updates
      socket.emit("user:join", { userId: user._id, role: user.role });
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("ride:updated", ({ ride, event }) => {
      if (user.role === "passenger") dispatch(getMyRides());
      if (user.role === "driver") dispatch(getAvailableRides());
      pushEvent(event, ride);
    });
    socket.on("ride:new", ({ ride }) => {
      if (user.role === "driver") dispatch(getAvailableRides());
      pushEvent("new", ride);
    });
    socket.on("ride:taken", ({ rideId, event }) => {
      if (user.role === "driver") dispatch(getAvailableRides());
      pushEvent(event || "taken", null, rideId);
    });

    socket.on("ride:sos", (payload) => {
      setSosEvent((prev) => ({ ...payload, seq: prev.seq + 1 }));
    });

    socket.on("driver:locationUpdate", ({ driverId, location }) => {
      setDriverLocations((prev) => ({ ...prev, [driverId]: location }));
    });

    socket.on("drivers:updated", (drivers) => {
      const locs = {};
      drivers.forEach((d) => { locs[d.driverId] = d.location; });
      setDriverLocations(locs);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, dispatch]);

  // Helper: driver emits location
  const emitDriverLocation = (driverId, location) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("driver:location", { driverId, location });
    }
  };

  // Helper: driver goes online
  const goOnline = (driverId, location) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("driver:online", { driverId, location });
    }
  };

  // Helper: driver goes offline
  const goOffline = (driverId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("driver:offline", { driverId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, rideEvent, sosEvent, driverLocations, emitDriverLocation, goOnline, goOffline }}>
      {children}
    </SocketContext.Provider>
  );
};