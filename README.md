# RideWave 2.0

A ride-booking web app for daily commuters in tier-2 Indian cities, built around shared rides that actually work for people going the same way. Major Project-II (01CE0807), Marwadi University, 2026-27.

**Version:** see `VERSION` · **Live demo:** _add URL after deploy_ · **Team:** Somesh Vanjani, Samarth Raval, Isha Makwana · **Guide:** Prof. Rupesh Kanojiya

## Features
- Passenger, driver and admin accounts with email OTP
- Book bike, auto or car with an upfront fare
- Live ride updates and live driver tracking over Socket.IO
- Instant pool matching with a 2 minute window, solo fallback and savings shown
- Route-corridor pooling (Sem 8 research): riders on the same route are pooled even with different stops, with a fair per-km fare split (`POOL_MATCHER=corridor`)
- AI on simulated data: intelligent ride pairing (acceptance prediction), route mapping (k-means corridors), data collection pipeline (`npm run train`, `POOL_MATCHER=smart`)
- ML Lab (admin, `/admin/ml-lab`): Sem 7 vs Sem 8 vs Sem 8 + ML matching on real road routes, with an "Explain it step by step" mode
- OTP ride start: 4-digit code shown only to the passenger
- Saved places for one-tap commute booking
- Recurring daily commute rides
- Razorpay (test mode) online payments
- Ratings and reviews
- Admin panel: stats, users, add/edit drivers, rides, daily rides, reviews

Full list with status: [`docs/FEATURES.md`](docs/FEATURES.md)

## Easiest way: double-click
Step by step guide with all demo logins: **[HOW_TO_RUN.md](HOW_TO_RUN.md)**

- **`RUN_RIDEWAVE.bat`**: start menu (quick start, faculty demo, phone demo, stop). On first run it downloads Node.js if missing, installs packages, starts the built-in database, backend and frontend, then opens the app.
- **`RIDEWAVE_TOOLS.bat`**: menu for stop, checks (tests, lint, build), demo accounts, saving work (git commit), checkpoints, version history.

## Quick start (manual)
```bat
# Backend
cd backend
npm install
copy .env.example .env        # fill MONGO_URI, JWT_SECRET, Razorpay test keys
node seedAdmin.js
node seedTestUsers.js
npm run dev                    # http://localhost:5000/api/health

# Frontend (new terminal)
cd frontend
npm install
npm run dev                    # http://127.0.0.1:5173
```

## Demo accounts (after seeding)
| Role | Email | Password |
|---|---|---|
| Admin | admin@ridewave.app | Admin@123 |
| Driver | driver@test.com | drive123 |
| Passenger | passenger@test.com | pass123 |
| Passenger 2 | passenger2@test.com | pass456 |

## Razorpay test payments
- Card (success): `5267 3181 8797 5449`, any future expiry, any CVV, OTP `1234` if asked
- Card (failure): `4000 0000 0000 0002`
- UPI: `success@razorpay` / `failure@razorpay`

## Documentation
| Doc | What it covers |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | system design, folders, data model, ride state machine, realtime events, pooling, jobs, security |
| [docs/API.md](docs/API.md) | every endpoint |
| [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md) | setup, git workflow, how to add a feature, definition of done, bug reports |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | hosting steps, env variables, smoke test |
| [docs/FEATURES.md](docs/FEATURES.md) | feature registry with status and owners |

## Tests
```bat
cd backend && npm test
npm run simulate              # pooling simulation, results in docs/results
npm run train                 # AI pairing model + corridor discovery (simulated data)
cd ..\frontend && npm run lint
```

## License
MIT
