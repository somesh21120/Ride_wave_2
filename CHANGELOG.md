# Changelog

All notable changes to RideWave. Newest first. Versions follow Semantic Versioning.
`1.x` = Sem 7 (Major Project-I). `2.0.0-alpha.N` = builds up to Review 1. `2.0.0-beta.N` = Review 2. `2.0.0` = final (13/02/2027).

How to release: update `VERSION` (here and in the SEM 8 root) and both `package.json` files, move the entries below into the new version with the date, commit, then `git tag -a v2.0.0-alpha.N -m "..."`. Run IDs (R00, R01, ...) are listed in `docs/RUN_LOG.md`.

Sem 8 changes are grouped three ways:
- **New in Sem 8**: capabilities RideWave did not have in Sem 7.
- **Optimization of Sem 7 modules**: Sem 7 features made complete, faster, more reliable or easier to use.
- **Engineering**: tests, versioning, documentation, tooling.

## [Unreleased]

### Review 1 finishing work (25/11)
- **Admin safety alerts:** SOS alerts listed on the admin Overview (last 24 h) with a live red banner and toast the moment a rider or driver presses SOS.
- **Live trip screen:** status stepper, large ride code card, pool card ("why you were matched", km shared, saving), Share trip and SOS for passengers (also during the trip), SOS for drivers.
- **Driver dashboard redesign:** online/offline switch, today's trips and earnings, new request cards with pool badge, friendly empty states.
- **ML Lab map on real roads:** pool routes, rider trips and k-means corridors follow streets (OSRM), cached for offline demos; explain mode shows correct percentages, real counts and illustrations.
- **Polish:** animated numbers, loading skeletons and button spinners, empty-state illustrations, booking success tick, searching tips, new toasts, smooth theme switch; all motion off under reduced motion.
- **My Rides:** filter chips (All, Active, Completed, Cancelled), savings from pooling, empty states.


### Engineering
- **Built-in local database:** `MONGO_URI=local` (the default for a fresh copy) runs MongoDB from inside the backend with no install; data in `backend/.localdb`; demo accounts created automatically in an empty database. RIDEWAVE_TOOLS option 14 switches between local and Atlas. A shared copy of the folder now runs on any PC with only Node.js.
- **Startup reliability:** the API starts before the database connects, retries every 10 s with plain-language reasons (Atlas IP allow list, paused cluster, blocked DNS with automatic public-DNS retry), and keeps a log in `backend/logs/server.log`; the launcher prints the cause instead of timing out.

- **Local-only phone demo:** RIDEWAVE_TOOLS option 15 serves a production build from the laptop to phones on the same Wi-Fi or hotspot, with an optional temporary public https link (Cloudflare quick tunnel). The frontend now reaches the API and Socket.IO through its own address (Vite proxy), so phones get live updates.

### Optimization of Sem 7 modules
- Real-time updates no longer blocked when the app is opened at 127.0.0.1 instead of localhost (both origins allowed in development).

## [2.0.0-alpha.2] Review 1 build (23/11/2026, tag after the browser check passes)

### New in Sem 8
- **Route-corridor pool matching (research contribution):** riders are pooled when their trips lie along the same route, not only when their stops are within 1.5 km. Corridor rules (off-route limit, direction, overlap, detour budget), spine selection, segment-wise fair fare split with at least 10% saving per rider, and a "why matched" note shown to riders. Live in the app with `POOL_MATCHER=corridor`; road routes from OSRM with straight-line fallback (`services/corridorMatch.js`, `services/routing.js`).
- **Pooling simulation:** synthetic Rajkot morning-commute demand replayed through Sem 7 and Sem 8 matching, with an ablation; writes a table, CSV and chart to `docs/results/` (`npm run simulate`).
- **AI on simulated data (proof of concept):** simulation engine with simulated rider decisions; data collection (labelled dataset of pool offers); intelligent ride pairing with a logistic regression model trained from scratch (about 72% accuracy, 0.78 AUC on held-out data) used by `POOL_MATCHER=smart`; route mapping with k-means corridor discovery; live-app decision logging (`MatchLog`) for future training on real data (`npm run train`).
- **Pooling Lab (`/lab`):** public page showing one simulated day on the map (pools, accepted and declined riders, AI predictions, discovered corridors), a 10-day comparison of Sem 7 vs Sem 8 vs Sem 8 + AI, how matching works, and the AI model card.
- **OTP ride start (safety):** a 4-digit ride code is created when a driver accepts, shown only to the passenger, and required to start the ride.
- **Saved places:** Home, Work, College and up to 5 places in Profile, with one-tap chips when booking.

### Optimization of Sem 7 modules
- Admin panel: ride detail drawer (timeline, people, route map, payment, pool), user role filter, ride status filter, Pooled Rides and Cancelled overview cards, layout for phones.
- Admin navigation on phones restored (navbar was hidden for admins under 768px).
- Pool matcher can no longer run two rounds at once while road routes load.

### Engineering
- 27 automated tests (state machine, fares, corridor matching, live corridor pooling step, ML and simulation); API smoke test now covers the ride code.
- `RUN_RIDEWAVE.bat` one-click start and `RIDEWAVE_TOOLS.bat` menu (checks, demo accounts, commits, checkpoints, simulation, matcher switch).
- New settings in `.env.example`: `POOL_MATCHER`, `ROUTING`, `OSRM_URL`. `/api/health` reports the active pool matcher.
- Version set to `2.0.0-alpha.2`.

## [2.0.0-beta.0] 24/11/2026 (night run)

### New in Sem 8
- **Visual identity:** teal brand (#0F766E), Plus Jakarta Sans + Instrument Serif fonts, new inline SVG logo, colour sweep removing all hardcoded amber/Inter.
- **App shell redesign:** glass sticky navbar with pill links and backdrop blur, avatar dropdown menu (Profile, Saved places, Log out), floating bottom nav with active dot, compact footer with Product/Company/Legal columns.
- **Landing page rebuild:** hero with display serif heading and italic teal word, SVG route card illustration (street grid + corridor), 3-step "How it works", ride types with real prices, "What's new in 2.0" grid with gold tags, driver CTA section. No testimonials, ratings, user counts, stock photos or em dashes.
- **Auth screens:** split-screen layout with brand panel (logo, display heading, benefits, corridor SVG), segmented Passenger/Driver control, all form fields and handlers preserved.
- **Passenger home dashboard:** display-font greeting, "Where to?" card with saved place chips, active ride card, stat cards (rides this month, total spent, pool savings), recent rides list with empty states, AI card linking to Pooling Lab.
- **Admin analytics:** GET /api/admin/analytics?days=N with daily rides/revenue/pooled aggregation, fillDays utility with unit tests. Frontend shows 4 chart cards (rides/day, revenue/day, by type, by status) using CSS-only horizontal bars.
- **Admin sidebar layout:** 240px sidebar on desktop with vertical tab pills, content area fills remaining width.

### Optimization of Sem 7 modules
- **Admin panel:** analytics endpoint and chart cards in Overview tab.

### Engineering
- 29 automated tests (analytics helpers added).
- Night run branch night-run-2026-11-24 with run log.

## [2.0.0-alpha.1] 22/11/2026

### New in Sem 8
- **UI redesign:** design system (colour, radius, shadow, type tokens; light and dark themes; shared components; guide in `frontend/src/styles/README.md`), redesigned landing page with real starting fares and no invented testimonials, map-first booking screen with a bottom sheet on phones, bottom navigation on phones, mobile layout across passenger and driver screens.
- Saved places API (`/api/auth/places`).

### Optimization of Sem 7 modules
- **Stability:** My Rides no longer crashes when a driver accepts (undefined variable in `DriverEnRoute`); ETA computed from the driver's live location instead of being stuck; missing addresses no longer crash ride cards; crash screen instead of a blank page.
- **Real-time:** server-pushed Socket.IO events (`ride:updated`, `ride:new`, `ride:taken`) replace polling as the main update path; polling kept as a 20 s safety net.
- **Ride logic:** state machine for ride status; atomic accept (no double booking); one active ride per driver; complete only after start; a driver who cancels releases the ride to other drivers; deactivated accounts blocked.
- **Admin panel:** add drivers, passengers and admins; ride detail API; overview stats for drivers, passengers, live rides and pool savings.
- **Hosting readiness:** `/api/health` with version and build, central JSON error handler, `CLIENT_URL` CORS, env-based API and socket URLs, `vercel.json`, MongoDB indexes.

### Engineering
- Unit tests (state machine, fares); API smoke test; local git history with run tags and backups; documentation (architecture, API, development guide, deployment guide, feature registry, task queue).
- Some React lint rules relaxed to warnings for untouched Sem 7 code (`frontend/eslint.config.js`).

## [1.x] Sem 7 baseline (August 2026, team 7P_077)
Passenger and driver accounts with email OTP, bike/auto/car booking with fares, ride lifecycle, proximity pooling with 2 minute window and solo fallback, recurring daily rides, Razorpay test payments, reviews, basic admin panel, Leaflet maps, dark/light theme.
