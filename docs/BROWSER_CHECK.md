# Review 1 Browser Check (build 2.0.0-alpha.2)

Run on localhost first, then again on the hosted build. Two browsers for passenger and driver (one normal, one incognito), three accounts for pooling. Check each screen at **390px** (DevTools device toolbar, iPhone 12/13/14) and at **desktop**.
Tick an item only after seeing it work. Note failures in the bug format from `docs/DEVELOPMENT_GUIDE.md` section 5.

## 1. Automated (run before anything else)
- [ ] `cd backend && npm test`: 27 passing (or menu option 3 in `RIDEWAVE_TOOLS.bat`)
- [ ] `cd frontend && npm run lint`: 0 errors
- [ ] `cd frontend && npm run build`: succeeds
- [ ] `http://localhost:5000/api/health`: status ok, version 2.0.0-alpha.2, db connected, poolMatcher shown
- [ ] `npm run simulate` in backend (or menu option 10): table printed, chart opens
- [ ] `http://localhost:5000/api/nothing`: JSON 404, not an HTML page

## 1a. Pooling Lab and AI
- [ ] `npm run train` in backend (or tools menu option 12): finishes, prints accuracy and AUC, saves `ml/pairing-model.json`
- [ ] Open `http://127.0.0.1:5173/lab` (menu option 13): map shows coloured pool routes over Rajkot, green/red/grey dots
- [ ] Switch Sem 7 / Sem 8 / Sem 8 + AI: map and numbers change; tap a dot: popup shows shared km, detour, saving (and AI prediction in AI mode)
- [ ] "New day" and the demand selector reload the simulation; "AI-discovered corridors" draws dashed purple lines
- [ ] Comparison table and AI model card load; page works at 390px
- [ ] "Pooling Lab" link in the public navbar, footer and admin panel header

## 2. Landing and navigation
- [ ] Landing at 390px: hero, how it works, features, ride types, call to action; no horizontal scroll; no testimonials
- [ ] Passenger logged in at 390px: bottom nav with 5 tabs, each tab opens the right page, active tab highlighted, no top navbar or footer
- [ ] Driver logged in at 390px: bottom nav with 2 tabs
- [ ] **Admin logged in at 390px: top navbar visible (menu, logout), no bottom nav**
- [ ] Desktop: normal navbar and footer for everyone, no bottom nav
- [ ] Dark mode toggle works and persists on every page

## 3. Saved places (new)
- [ ] Profile (passenger): "Saved places" card; add Home with the address search; add College using the suggestion chip
- [ ] Rename and delete a place; a sixth place is refused with a message
- [ ] Book Ride at 390px: Home and College chips above pickup and drop-off; tap Home (pickup) and College (drop-off); fare appears; confirm works
- [ ] Same on desktop layout
- [ ] Driver Profile does not show Saved places

## 4. Booking and ride lifecycle
- [ ] Booking sheet at 390px: map fills the screen, sheet handle cycles through three heights, confirm button stays visible
- [ ] Cash booking: "Searching for driver" shows; driver sees the request without refreshing
- [ ] Driver accepts: passenger screen switches to "Driver on the way" without refreshing, shows vehicle type and number, no crash
- [ ] Driver location moves on the passenger map; ETA shows minutes
- [ ] **Ride code:** after accept, the passenger's "Driver on the way" card shows a 4-digit code; the driver's screen shows a code box and Start stays disabled until 4 digits are typed
- [ ] A wrong code gives "Incorrect ride code"; the right code starts the ride
- [ ] If the driver cancels and another driver accepts, the passenger gets a new code
- [ ] Start, then Complete: both screens update without refreshing; Complete is not offered before Start
- [ ] Passenger cancel works before pickup and is not offered once ongoing
- [ ] Driver cancels an accepted ride: passenger sees "Finding driver" again; ride reappears for other drivers only
- [ ] Two drivers accept the same ride: one succeeds, the other gets "Ride no longer available"
- [ ] Online payment opens Razorpay test checkout (card 5267 3181 8797 5449, OTP 1234) and books after success
- [ ] Instant pool, two nearby passengers within 2 minutes: matched, savings shown. One passenger alone: solo after 2 minutes
- [ ] **Corridor pooling** (switch with menu option 11, restart): passenger A books a long trip (for example Kalawad Road to Marwadi University); within 2 minutes passenger B books a shorter trip along the same road with different stops. They are pooled; My Rides shows "Why matched: Shares ... km"; both fares are below the solo fare
- [ ] With corridor on, two trips in opposite directions are not pooled
- [ ] Rate driver after completion

## 5. Admin panel
- [ ] Overview: Users, Rides, Completed, Revenue, Drivers, Passengers, Live Rides, Pool Savings, Pooled Rides, Cancelled cards; wrap on a phone
- [ ] Users: search, role filter, edit (incl. vehicle), activate/deactivate, delete
- [ ] Add Driver / User: create a car driver; that driver can log in
- [ ] Deactivated user cannot log in
- [ ] Rides: status filter changes the list and count
- [ ] Rides: "View details" opens the drawer with timeline, passenger, driver, map, payment, pool info; Escape and the X close it; works for a ride with no driver
- [ ] Drawer: status change and delete work
- [ ] Admin at 390px: tabs scroll sideways in one row, rows stack, buttons easy to tap, drawer is full screen
- [ ] Daily rides and Reviews tabs load; review delete works

## 6. Hosted build (after deploy)
- [ ] Sections 2 to 5 spot-checked on a real phone over mobile data
- [ ] Location permission prompt appears (needs https)
- [ ] `/api/health` on the hosted backend shows the expected version and build
