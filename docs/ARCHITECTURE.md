# RideWave Architecture

How the system is put together, so anyone on the team (or an AI coding agent) can add a feature without breaking another. Keep this file updated whenever you add a model, route, socket event or service.

Version covered: 2.0.0-dev (Sem 8, Major Project-II)

---

## 1. System overview

```
 Browser (React + Vite)                       Node.js server (Express)                 MongoDB
 ┌────────────────────────┐   HTTPS /api/*    ┌──────────────────────────────┐        ┌──────────┐
 │ pages/  components/    │ ────────────────▶ │ routes ▶ middleware ▶ ctrl   │ ─────▶ │ users    │
 │ redux/ (auth, ride,    │                   │            │                 │        │ rides    │
 │         recurring)     │ ◀──── JSON ────── │            ▼                 │        │ recurring│
 │ context/SocketContext  │                   │ services/realtime.notifyRide │        │ reviews  │
 │                        │ ◀── Socket.IO ─── │ socket/socketHandler (rooms) │        └──────────┘
 └────────────────────────┘                   │ services/poolMatchService    │ every 15 s
                                              │ services/recurringScheduler  │ every 5 min (cron)
 OpenStreetMap tiles, Nominatim (search),     └──────────────────────────────┘
 OSRM (routes) called from the browser        Razorpay (test mode) for online payments
```

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Redux Toolkit, React Router, Tailwind + CSS variables, Leaflet / react-leaflet, socket.io-client, lucide-react icons |
| Backend | Node.js, Express 5, Mongoose 9, Socket.IO 4, node-cron, JWT, bcryptjs, Razorpay SDK |
| Database | MongoDB (local for development, MongoDB Atlas when hosted) |
| Maps | OpenStreetMap tiles, Nominatim geocoding, OSRM routing (no API keys) |

---

## 2. Folder structure

```
ridewave-app/
├── VERSION                     current version (keep in sync with package.json files)
├── docs/                       this documentation
├── backend/
│   ├── server.js               app setup: CORS, routes, /api/health, error handler, DB connect, start services
│   ├── config/index.js         every env variable in one place
│   ├── models/                 Mongoose schemas: User, Ride, RecurringRide, Review
│   ├── routes/                 URL to controller mapping (one file per resource)
│   ├── controllers/            request handlers (validation, business rules, DB calls)
│   ├── middleware/
│   │   ├── authMiddleware.js   protect (JWT), admin, requireRole(...)
│   │   └── errorMiddleware.js  ApiError, notFound, errorHandler, asyncHandler
│   ├── services/
│   │   ├── realtime.js         notifyRide(ride, event): pushes ride changes over Socket.IO
│   │   ├── poolMatchService.js fare calculation + pool matching loop
│   │   └── recurringScheduler.js daily ride generation (cron)
│   ├── socket/socketHandler.js Socket.IO rooms and driver location relay
│   ├── utils/rideStateMachine.js allowed ride status transitions
│   ├── tests/                  node:test unit tests (npm test)
│   ├── seedAdmin.js            creates the admin account
│   └── seedTestUsers.js        creates demo driver and passengers
└── frontend/
    ├── vite.config.js          dev server + /api proxy to :5000
    └── src/
        ├── main.jsx            providers: Redux, Theme, Maps, Socket, Toast, ErrorBoundary
        ├── App.jsx             all routes; PrivateRoute / AdminRoute guards
        ├── services/api.js     axios instance (base URL from VITE_API_URL), adds JWT
        ├── services/geocode.js Nominatim search / reverse geocode
        ├── redux/              authSlice, rideSlice, recurringSlice, store
        ├── context/            SocketContext (live events), ThemeContext, ToastContext, MapsContext
        ├── components/         shared UI (Navbar, MapComponent, DriverEnRoute, admin/AddUserModal, ...)
        └── pages/              one file per screen
```

---

## 3. Data model

### User (`models/User.js`)
| Field | Notes |
|---|---|
| name, email (unique), password (bcrypt hashed), phone | required |
| role | `passenger` / `driver` / `admin` |
| isActive | false = cannot log in or call the API (403) |
| isVerified | email verified via OTP, or created by admin |
| vehicle { type, model, number, carSubtype, seatingCapacity } | drivers only; seatingCapacity includes the driver |
| idProof | placeholder for driver documents (roadmap A5 replaces this) |

### Ride (`models/Ride.js`)
| Group | Fields |
|---|---|
| Who | passenger, driver, coRiders[] { user, pickupLocation, fare, status } |
| Where | pickupLocation { address, lat, lng }, dropoffLocation, distance (km) |
| What | rideType (bike/auto/car), fare, paymentMethod (cash/online), paymentStatus |
| Lifecycle | status, acceptedAt, startedAt, completedAt, cancelledBy, rejectedBy[] |
| Pool (manual) | rideCategory (standard/pool), poolType, seatsTotal, seatsAvailable |
| Pool (instant match) | poolMatchStatus (solo / waiting_for_match / matched / reverted_to_solo), poolMatchedRide, poolSavings, poolMatchRequestedAt, poolMaxPassengers |
| Links | recurringRideId |

Indexes: `{status, rideType, createdAt}`, `{passenger, createdAt}`, `{driver, status}`, `{poolMatchStatus, poolMatchRequestedAt}`.

### RecurringRide (`models/RecurringRide.js`)
passenger, pickupLocation, dropoffLocation, rideType, paymentMethod, time ("HH:MM"), daysOfWeek [0..6], active, lastGeneratedDate.

### Review (`models/Review.js`)
ride, reviewer, reviewerRole, reviewee, rating 1 to 5, comment.

---

## 4. Ride lifecycle (state machine)

Defined once in `backend/utils/rideStateMachine.js`. Every passenger/driver action calls `assertTransition(from, to)`.

```
requested ──accept──▶ accepted ──start──▶ ongoing ──complete──▶ completed
    │                    │
    └──── cancel ────────┴──────────────────────────────────▶ cancelled
```

| Action | Who | Rule |
|---|---|---|
| accept | driver | atomic claim (`findOneAndUpdate` on status "requested"), so two drivers cannot both get it; a driver with an active ride cannot accept another; creates the ride code (`startOtp`, hidden from drivers by `select: false`, returned only to the passenger) |
| start | assigned driver | accepted to ongoing; requires the 4-digit ride code (OTP) the passenger sees in their app |
| complete | assigned driver | ongoing to completed only (must start first); marks payment paid |
| cancel | passenger | requested or accepted to cancelled |
| cancel | assigned driver | accepted ride goes **back to requested** for another driver; the driver is added to rejectedBy |
| reject | driver | hides a requested ride from that driver |
| any | admin | override, any status (for fixing stuck demo data) |

Unit tests: `backend/tests/rideStateMachine.test.js`.

---

## 5. Realtime (Socket.IO)

The server is the source of truth: a controller updates MongoDB, then calls `notifyRide(ride, event)` from `services/realtime.js`.

**Rooms:** `user:<id>` (each logged-in user), `drivers`, `admins`. The client joins on connect with `user:join { userId, role }` (done in `SocketContext.jsx`).

| Server event | Sent to | When |
|---|---|---|
| `ride:updated { ride, event }` | passenger, driver, co-riders, admins | booked, accepted, started, completed, cancelled, driver_cancelled, pool_matched, pool_solo, pool_absorbed, admin_updated |
| `ride:new { ride }` | drivers | a request becomes available (booked, pool closed, solo fallback, driver released it) |
| `ride:taken { rideId, event }` | drivers | a request is no longer available |
| `driver:locationUpdate { driverId, location }` | everyone | driver position (sent by the driver's browser every few seconds) |
| `drivers:updated [...]` | everyone | online driver list changed |

**Client side:** `SocketContext` dispatches `getMyRides()` (passenger) or `getAvailableRides()` (driver) on each event and exposes `rideEvent.seq`, which pages watch to refresh (see `DriverDashboard.jsx`). Polling stays as a 20 s safety net only.

To add a new realtime feature: emit from the controller through `services/realtime.js`, document the event in the table above, handle it in `SocketContext.jsx`.

---

## 6. Pricing and pooling

**Fare** (`services/poolMatchService.js > calcFare`): `base + perKm x distance`, rounded.

| Type | Base (₹) | Per km (₹) |
|---|---|---|
| bike | 20 | 8 |
| auto | 30 | 12 |
| car | 50 | 18 |

Rides over 50 km are rejected (`MAX_RIDE_DIST_KM` in rideController).

**Instant pool matching v1** (proximity based, runs every 15 s):
1. Waiting pool requests are grouped by vehicle type (car, auto).
2. The oldest request is the lead. Newer requests whose pickup **and** drop-off are both within 1.5 km of the lead's are added, up to the cap (auto 3, car = poolMaxPassengers, default 3).
3. Pool is closed when full, or when the lead's 2 minute window expires with at least one match. Everyone pays the tiered discount (2 riders 30% off, 3 riders 45% off, ...). Co-rider requests are absorbed into the lead ride.
4. No match after 2 minutes: the request reverts to a solo ride at full fare.

**Route-corridor matching v2** (roadmap A1, the research contribution), `services/corridorMatch.js`. Enabled in the live app with `POOL_MATCHER=corridor` (default `proximity`).
1. The corridor is a rider's route: an OSRM road route (`services/routing.js`, 3 s timeout) or a straight line as fallback.
2. Each candidate's pickup and drop-off are projected onto the corridor. Accepted if both are within 1.5 km of it (same tolerance as v1), the pickup comes before the drop-off, at least 1 km and 60% of the candidate's trip is shared, and the detour is at most 3 km.
3. Detour = 2 x off-route distance for a stop in the middle of the route, 1 x for a stop before the start or after the end.
4. Greedy filling, longest shared distance first, within the seat limit and a total detour budget of 35% of the route.
5. **Spine selection:** if the first request lies inside a longer waiting trip, the longer trip becomes the corridor; the first request is always included. The grouping with the most riders, then the least detour, wins.
6. **Fare split:** base fare shared equally; every km of the route is split equally among the riders in the car on that km; each rider pays their own detour; nobody pays more than 90% of their solo fare.
7. Each pooled ride stores `poolMatcher` and `poolMatchNote` ("Shares 4.3 km of the route, adds 0.8 km detour, saves ₹38"), shown to the rider; co-riders store `dropoffLocation`, `sharedKm`, `detourKm`.

Evaluation: `npm run simulate` (`backend/scripts/simulate-pooling.js`) replays synthetic Rajkot morning-commute demand through v1 and v2 and writes `docs/results/pooling-simulation.md`, `.csv` and `.svg`, including an ablation (v2 without spine selection). Tests: `tests/corridorMatch.test.js`, `tests/poolCorridor.test.js`.

---

## 6a. AI and data (simulated, proof of concept)

Everything here runs on synthetic data and is labelled that way in the app and the report.

| Piece | File | What it does |
|---|---|---|
| Simulation engine | `services/simulation.js` | Synthetic Rajkot morning-commute demand; runs Sem 7, Sem 8 or Sem 8 + AI matching in 2-minute windows; offers pools to simulated riders whose accept/decline follows a hidden formula plus a random personal tolerance |
| Data collection (simulated) | `scripts/train-pairing-model.js` | Logs every pool offer with 7 features and the rider's decision to `docs/results/pairing-dataset.csv` |
| Data collection (live app) | `models/MatchLog.js`, `poolMatchService.logDecisions` | Stores every candidate the corridor/smart matcher evaluated (features, prediction, chosen) and labels it with the pooled ride's outcome (completed/cancelled) |
| Intelligent ride pairing | `ml/logistic.js`, `ml/features.js`, `ml/pairing-model.json` | Logistic regression (written from scratch) predicting acceptance; trained 80/20; smart matcher ranks candidates by it and skips pairs below 0.35 |
| Route mapping | `ml/kmeans.js` | k-means on (pickup, drop-off) discovers commute corridors |
| Pooling Lab | `routes/labRoutes.js`, `frontend/src/pages/PoolingLab.jsx` | Public page `/lab`: map of one simulated day, 10-day comparison of all three methods, how-it-works steps, model card (accuracy, AUC, learned weights, corridors) |

Pipeline: `npm run train` (collect, train, evaluate on held-out data and unseen days, discover corridors, save model) then `POOL_MATCHER=smart` in the live app. Report: `docs/results/ai-pairing-model.md`. Tests: `tests/ml.test.js`.

Findings to state honestly: the model reaches about 72% accuracy / 0.78 AUC on held-out simulated decisions; its benefit is higher offer acceptance (fewer unwanted offers) at equal or slightly higher pooling, and it grows with demand because there are more partners to choose from.

## 7. Background jobs

| Job | File | Frequency | Notes |
|---|---|---|---|
| Pool matcher | services/poolMatchService.js | every 15 s | started after DB connects |
| Recurring rides | services/recurringScheduler.js | every 5 min | creates today's ride once the scheduled time has passed |

Both need a server that keeps running. Hosting must be a persistent Node process, not serverless functions (see DEPLOYMENT.md).

---

## 8. Security model

- JWT (7 days) in `Authorization: Bearer <token>`, stored in localStorage by the frontend.
- `protect` loads the user on every request and rejects deleted or deactivated accounts.
- `admin` and `requireRole(...)` guard role-specific routes.
- Passwords hashed with bcrypt (10 rounds).
- CORS and Socket.IO restricted to `CLIENT_URL` when set.
- Email OTP is in memory and returned in the API response for demo purposes (no paid email provider). Roadmap B8 covers real email delivery and rate limiting.
- Razorpay payment signature verified server side (HMAC SHA256).

---

## 9. Known limitations (tracked in UPGRADE_ROADMAP.md)

- ETA is straight-line distance at 25 km/h, not road distance (A2).
- The simulation uses synthetic demand and straight-line routes; results are indicative, not measured on real trips.
- In a pool, only the main (spine) passenger has a ride code; co-riders board the same car.
- OTP store and online driver list are in memory, so they reset when the server restarts.
- No input schema validation library yet (E2).
- No document upload for drivers yet (A5).
