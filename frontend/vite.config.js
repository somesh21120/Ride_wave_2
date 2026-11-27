import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local-only setup: the laptop serves everything.
// - host: true      -> phones on the same Wi-Fi / hotspot can open http://<laptop-ip>:5173
// - allowedHosts    -> a temporary public link (RIDEWAVE_TOOLS option 15, Cloudflare quick tunnel) is accepted
// - /api and /socket.io are proxied to the backend, so the browser only ever talks to this one address
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true, // one frontend only: a second copy stops instead of opening on 5174
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
