# RideWave Development Guide

How we work on RideWave so three people (and AI coding agents) can add features quickly without breaking each other's work.

## 1. Run it locally (Windows, Command Prompt)

Open `RideWave.code-workspace` in VS Code; the terminal defaults to Command Prompt. Ready-made tasks: Terminal > Run Task > "Run both servers", "Check everything", "Seed admin + demo users".

Prerequisites: Node.js 20 or newer, MongoDB running locally (or an Atlas URI), Git.

```bat
# Backend
cd /d "D:\25_MajorProject\SEM 8\ridewave-app\backend"
npm install
copy .env.example .env          # fill MONGO_URI, JWT_SECRET, Razorpay test keys
node seedAdmin.js                # admin@ridewave.app / Admin@123 (from .env)
node seedTestUsers.js            # demo driver + passengers
npm run dev                      # http://localhost:5000, check http://localhost:5000/api/health
npm test                         # unit tests

# Frontend (second terminal)
cd /d "D:\25_MajorProject\SEM 8\ridewave-app\frontend"
npm install
npm run dev                      # http://127.0.0.1:5173
npm run lint
```

Testing realtime needs two browsers (or one normal + one incognito): one passenger, one driver. Pools need three accounts.

## 2. Git workflow

- `main` is always demo-ready. Never commit broken code to main.
- One branch per task: `feat/admin-add-driver`, `fix/myrides-crash`, `ui/landing-redesign`, `docs/api`.
- Small commits with clear messages:
  - `feat(admin): add driver from admin panel`
  - `fix(rides): atomic accept to stop double booking`
  - `ui(booking): bottom sheet layout on mobile`
  - `docs: update API reference`
- Open a pull request into main, one teammate reviews and runs the checklist, then merge.
- Commit at least every working day you work. The guide checks the GitHub history.
- Never commit `.env`, `node_modules`, or real keys. `.env.example` lists every variable.

## 3. Adding a feature: the recipe

Follow the same path every time so the code stays predictable.

**Backend**
1. **Model**: add fields to `models/*.js` with defaults so old documents still work. Add an index if you will query on it.
2. **Rules**: if it touches ride status, use `utils/rideStateMachine.js`. Never set `ride.status` by hand outside it (admin override excepted).
3. **Controller**: one exported function per action in `controllers/<resource>Controller.js`. Validate input first, check permissions (who owns this?), then change data.
4. **Route**: add it in `routes/<resource>Routes.js` with `protect` and the right role guard (`admin` or `requireRole("driver")`).
5. **Realtime**: if other users should see the change instantly, call `notifyRide(ride, "<event>")` from `services/realtime.js` and add the event to ARCHITECTURE.md section 5.
6. **Test**: pure logic (fares, matching, rules) gets a unit test in `backend/tests/`.
7. **Docs**: add the endpoint to `docs/API.md`.

**Frontend**
1. API call through `services/api.js` (never hardcode `http://localhost:5000`).
2. Shared data goes in a Redux slice (`redux/`); screen-only state stays in the component.
3. New screen: `pages/<Name>.jsx`, add the route in `App.jsx` inside `PrivateRoute` or `AdminRoute`.
4. Reuse components in `components/`. Admin-only components go in `components/admin/`.
5. Use the CSS variables (`var(--brand)`, `var(--text-primary)`, ...) and existing classes (`rw-card`, `rw-btn-primary`, `rw-input`) so dark mode keeps working.
6. Mobile first: check every screen at 360 px wide in browser dev tools before committing. No fixed multi-column grids; use `repeat(auto-fit, minmax(...))` or flex-wrap.
7. Guard data that may be missing: `ride.driver?.name`, `ride.pickupLocation?.address`.
8. Listen for realtime updates with `const { rideEvent } = useSocket()` and refresh in a `useEffect` on `rideEvent.seq`.

**Then**
- Update `docs/FEATURES.md` (status, files, owner).
- Add a line under "Unreleased" in the root `CHANGELOG.md`.
- Note it in `WEEKLY_LOG.md` for this week.

## 4. Definition of done

A task is done only when all of these are true:
- [ ] Works end to end in the browser for every role it affects (passenger, driver, admin)
- [ ] Works at phone width (360 px) and in dark mode
- [ ] No errors in the browser console or backend terminal
- [ ] `npm test` (backend) and `npm run lint` (frontend) pass
- [ ] Docs updated (API.md / ARCHITECTURE.md / FEATURES.md as relevant)
- [ ] Committed on a branch and merged after a teammate checked it
- [ ] Works on the hosted staging site after deploy

## 5. Reporting a bug (so it gets fixed in one pass)

```
Where: page / URL, role (passenger, driver, admin), phone or desktop
Steps: 1. ... 2. ... 3. ...
Expected: ...
Actual: ...
Console error: (copy the red text from browser DevTools > Console)
Backend log: (copy from the terminal running npm run dev)
```
The ErrorBoundary screen also shows the error message; copy that too.

## 6. Working with an AI coding agent

- Start every prompt with: project path, "Command Prompt (cmd) only", "read AGENTS.md first".
- One feature per prompt. Name the exact files to touch and the acceptance checks.
- Ask for a read-only audit first when something "should already work".
- After the agent finishes: run the definition of done yourself. A passing build is not proof.
- Commit after every working feature so a bad prompt can be rolled back with `git restore`.
- Agent rules live in `AGENTS.md` (read automatically via `.clinerules` / `CLAUDE.md`); the task list is `docs/AGENT_QUEUE.md`. Send: "Do the next unchecked task in docs/AGENT_QUEUE.md."
- `.clineignore` keeps the agent away from `node_modules`, builds, images and `.env` to save credit.

## 7. Versioning

Semantic versioning, kept in `VERSION` (root and `ridewave-app/`) and both `package.json` files.
`2.0.0-alpha.N` up to Review 1, `2.0.0-beta.N` for Review 2, `2.0.0-rc.N` before Review 3, `2.0.0` final.
Release: bump versions, move "Unreleased" in CHANGELOG to the new version with the date, commit, `git tag v2.0.0-alpha.1`, `git push --tags`.
