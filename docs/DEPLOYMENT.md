# RideWave Deployment Guide

> **Team decision (24/11/2026): local only.** The project is not pushed to GitHub and not hosted. Demos run from the laptop with the built-in local database; phones connect as described in `docs/PHONE_DEMO.md`. The cloud steps below are kept only for reference in case this decision changes later.

Goal: a live URL that works on a phone, up by **24/11/2026** (staging, before Review 1) and kept up through Review 3. Missing hosting cost us marks in Sem 7.

## 1. Shape of the deployment

| Part | Where | Why |
|---|---|---|
| Database | MongoDB Atlas (free shared cluster) | managed, reachable from any host |
| Backend | a host that runs a **persistent Node.js process** (for example Render, Railway or Fly.io) | Socket.IO, the pool matcher and the recurring-ride cron all need a server that stays running. Serverless functions will not work. |
| Frontend | a static host (for example Vercel, Netlify or Cloudflare Pages) | it is a Vite build of static files |

Free tiers and their limits change often. Before choosing, check each provider's current pricing page for: does the free backend sleep when idle, monthly hour limits, and whether WebSockets are supported. If the free backend sleeps, open `/api/health` a few minutes before every review to wake it, and know that the recurring-ride cron does not run while it sleeps.

## 2. Step by step

### 2.1 Database (Atlas)
1. Create a free cluster, a database user, and allow network access from anywhere (`0.0.0.0/0`) for the demo.
2. Copy the connection string: `mongodb+srv://<user>:<pass>@<cluster>/ridewave?retryWrites=true&w=majority`.

### 2.2 Backend
1. Push `ridewave-app` to GitHub.
2. New web service from the repo, root directory `backend`.
3. Build command `npm install`, start command `npm start`.
4. Environment variables:

| Variable | Value |
|---|---|
| `MONGO_URI` | Atlas string |
| `JWT_SECRET` | long random string (not the local one) |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | the frontend URL(s), comma separated, e.g. `https://ridewave.vercel.app` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | test-mode keys |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for the seed script |
| `BUILD_ID` | optional — commit SHA or release tag, appears in `/api/health` |

**Frontend env variables** (set at build time):
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<backend>/api` |
| `VITE_SOCKET_URL` | `https://<backend>` |

Do **not** set `PORT` unless the host asks you to; most hosts inject it.
5. Deploy, then open `https://<backend>/api/health`. Expect `"status":"ok"` and `"db":"connected"`.
6. Seed once (from your PC with `MONGO_URI` pointing at Atlas, or the host's shell): `node seedAdmin.js` and `node seedTestUsers.js`.

### 2.3 Frontend
1. New project from the same repo, root directory `frontend`, framework Vite.
2. Build command `npm run build`, output directory `dist`.
3. Environment variables (set before building):

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<backend>/api` |
| `VITE_SOCKET_URL` | `https://<backend>` |

4. `frontend/vercel.json` already rewrites every path to `index.html` so refreshing `/my-rides` does not 404. On Netlify use a `_redirects` file with `/* /index.html 200` instead.
5. Deploy, then add the final frontend URL to the backend's `CLIENT_URL` and redeploy the backend.

## 3. Smoke test after every deploy (5 minutes)

- [ ] `/api/health` shows ok + connected and the expected version
- [ ] Landing page loads on a phone (mobile data, not Wi-Fi) over https
- [ ] Log in as admin: overview numbers load, Add Driver works
- [ ] Passenger books a ride; driver (second device) sees it without refreshing
- [ ] Driver accepts; passenger screen switches to "Driver on the way" without refreshing
- [ ] Location permission prompt appears (needs https)
- [ ] Start, complete, rate driver
- [ ] Online payment opens Razorpay test checkout

## 4. Before each review

- [ ] Redeploy from `main`, tag the release
- [ ] Wake the backend 10 minutes before
- [ ] Demo accounts written down (admin, driver, 2 passengers)
- [ ] Backup demo video on the laptop in case the venue Wi-Fi fails
- [ ] Phone hotspot ready
