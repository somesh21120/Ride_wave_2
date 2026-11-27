# Feature Registry

Every feature, its status, where the code lives, and who owns it. Update the row when you touch a feature. Roadmap IDs refer to `UPGRADE_ROADMAP.md` in the SEM 8 folder.

Status: ✅ done and verified in browser · 🟡 done in code, needs browser check · 🔨 in progress · ⏳ planned

## Sem 8 at a glance
**New in Sem 8:** route-corridor pooling with spine selection and fair fare split, pooling simulation with ablation, AI ride pairing and route mapping on simulated data, Pooling Lab demo page, OTP ride start, saved places, full UI redesign (design system, landing, map-first booking, bottom navigation, mobile layouts).
**Optimization of Sem 7 modules:** stability fixes (My Rides crash, ETA, crash screen), server-pushed real-time updates, ride rules (state machine, atomic accept, reassignment, deactivated accounts), complete admin panel (add drivers, ride detail, filters, stats, phone layout), hosting readiness.
**Planned (Review 2 onward):** SOS and share-trip link, driver document verification, analytics charts, commute groups, PWA. Deployment is scheduled before Review 1.

## Accounts and auth
| Feature | Status | Backend | Frontend | Owner | Since |
|---|---|---|---|---|---|
| Passenger / driver registration with email OTP | ✅ | authController.registerUser, sendOtp | PassengerRegister, DriverRegister | S | v1 |
| Login (separate passenger / driver pages) | ✅ | authController.loginUser | PassengerLogin, DriverLogin | S | v1 |
| Deactivated accounts blocked at login and API | 🟡 | authController.loginUser, authMiddleware.protect | | S | v2 |
| Profile edit incl. driver vehicle | ✅ | authController.updateUserProfile | Profile | I | v1 |
| Forgot password, rate limits (B8) | ⏳ | | | S | |

## Booking and ride lifecycle
| Feature | Status | Backend | Frontend | Owner | Since |
|---|---|---|---|---|---|
| Book bike / auto / car with fare estimate | 🟡 | rideController.bookRide, poolMatchService.calcFare | BookRide | S | v1 |
| 50 km distance cap | ✅ | rideController.bookRide | BookRide | S | v1 |
| Ride state machine (no skipped or invalid steps) | 🟡 | utils/rideStateMachine | | S | v2 |
| Atomic accept, one active ride per driver | 🟡 | rideController.acceptRide | DriverDashboard | S | v2 |
| Driver cancel releases ride to other drivers | 🟡 | rideController.cancelRide | DriverDashboard | S | v2 |
| Driver en route screen with vehicle details and ETA | 🟡 (crash fixed in v2) | | DriverEnRoute | I | v1 |
| Live updates pushed over Socket.IO | 🟡 | services/realtime, socket/socketHandler | SocketContext, MyRides, DriverDashboard | S | v2 |
| Live driver location on map | ✅ | socketHandler | DriverEnRoute | S | v1 |
| OTP ride start (A3): code on accept, shown only to passenger, required to start | 🟡 | rideController.acceptRide/startRide, Ride.startOtp | DriverEnRoute, DriverDashboard | S | v2 |
| SOS + share trip (A4) | ⏳ | | | I | |
| Saved places (A7): API, Profile manager, booking chips | 🟡 | authController (places), models/User.savedPlaces | components/places/, Profile, BookRide, BookingSheet | I | v2 |

## Pooling and daily rides
| Feature | Status | Backend | Frontend | Owner | Since |
|---|---|---|---|---|---|
| Manual pools (create / join / leave) | ✅ | rideController.joinPool, leavePool | Pool | Sa | v1 |
| Instant proximity pool matching, 2 min window, solo fallback | ✅ | poolMatchService | BookRide | Sa | v1 |
| Route-corridor pooling v2 (A1): corridor rules, spine selection, segment fare split, "why matched" note | 🟡 (behind `POOL_MATCHER=corridor`) | services/corridorMatch, routing, poolMatchService | MyRides, BookRide | Sa | v2 |
| Pooling simulation + ablation (E9), results in docs/results | ✅ | scripts/simulate-pooling.js | | Sa | v2 |
| AI: data collection (simulated dataset + live MatchLog) | 🟡 | services/simulation, models/MatchLog | | Sa | v2 |
| AI: intelligent ride pairing (logistic regression, `POOL_MATCHER=smart`) | 🟡 | ml/, poolMatchService | | Sa | v2 |
| AI: route mapping (k-means commute corridors) | ✅ | ml/kmeans | PoolingLab | Sa | v2 |
| Pooling Lab page `/lab` (visual demo of all three methods + model card) | 🟡 | routes/labRoutes | pages/PoolingLab | S | v2 |
| Recurring daily rides | ✅ | recurringRideController, recurringScheduler | DailyRides | Sa | v1 |

## Payments and reviews
| Feature | Status | Backend | Frontend | Owner | Since |
|---|---|---|---|---|---|
| Razorpay test checkout, ride created after payment | ✅ | paymentController | BookRide | S | v1 |
| Ratings and reviews after completion | ✅ | reviewController | ReviewForm, MyRides, DriverDashboard | I | v1 |

## Admin panel
| Feature | Status | Backend | Frontend | Owner | Since |
|---|---|---|---|---|---|
| Overview stats | ✅ | adminController.getStats | AdminDashboard | I | v1 |
| Extra stats: drivers, passengers, live rides, pool savings, pooled rides, cancelled | 🟡 | adminController.getStats | AdminDashboard | I | v2 |
| Users: search, edit, activate/deactivate, delete | ✅ | adminController | AdminDashboard | I | v1 |
| **Add driver / user from admin panel** | 🟡 | adminController.createUser | components/admin/AddUserModal | I | v2 |
| Rides: list, change status, delete | ✅ | adminController | AdminDashboard | I | v1 |
| Ride detail drawer (timeline, people, map, payment, pool) | 🟡 | adminController.getRideDetail | components/admin/RideDetailDrawer | I | v2 |
| Filters: users by role, rides by status | 🟡 | adminController.getUsers, getRides | AdminDashboard | I | v2 |
| Admin panel on phones (scrolling tabs, stacked rows, 44px buttons, navbar kept) | 🟡 | | AdminDashboard, App.jsx, index.css | I | v2 |
| Recurring rides list, reviews list and delete | ✅ | adminController, reviewController | AdminDashboard | I | v1 |
| Driver verification queue (A5), SOS monitor, CSV export, analytics charts (A9) | ⏳ | | | I | |

## Platform
| Feature | Status | Where | Owner | Since |
|---|---|---|---|---|
| Health endpoint `/api/health` | 🟡 | server.js | S | v2 |
| Central error handler, 404 for unknown API routes | 🟡 | middleware/errorMiddleware | S | v2 |
| Env-based API / socket URLs for hosting | 🟡 | frontend services/api.js, SocketContext | S | v2 |
| CORS limited to CLIENT_URL | 🟡 | config/index.js | S | v2 |
| Crash screen instead of blank page | 🟡 | components/ErrorBoundary | I | v2 |
| Unit tests (state machine, fares) | ✅ | backend/tests | Sa | v2 |
| VS Code tasks for dev, test, lint, build | ✅ | .vscode/ | S | v2 |
| Staging deployment | ⏳ | docs/DEPLOYMENT.md | S | |
| Design system + redesigned screens (C1 to C3), mobile layout (D1 to D3) | 🟡 | frontend/src/index.css, frontend/tailwind.config.js, frontend/src/styles/README.md | I | v2 |
| Landing page redesign (C2) | 🟡 | frontend/src/pages/Landing.jsx | I | v2 |
| Mobile bottom navigation (D2) | 🟡 | frontend/src/components/BottomNav.jsx | I | v2 |
