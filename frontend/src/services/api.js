import axios from "axios";
import { incrementPending, decrementPending } from "../components/ui/TopProgress";
// Local dev: "/api" is proxied to the backend by vite.config.js.
// Hosted: set VITE_API_URL=https://your-backend.example.com/api at build time.
export const API_URL = import.meta.env.VITE_API_URL || "/api";
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  incrementPending();
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch { }
  return config;
});
api.interceptors.response.use(
  (response) => { decrementPending(); return response; },
  (error) => {
    decrementPending();
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes("/login");
      if (!isLoginPage) { localStorage.removeItem("user"); window.location.href = "/login"; }
    }
    return Promise.reject(error);
  }
);
export default api;
