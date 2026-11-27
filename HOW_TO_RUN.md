# How to run RideWave

RideWave runs fully on one Windows laptop. Nothing has to be installed by hand.

## What you need
- A Windows 10 or 11 laptop
- Internet for the **first** start only (it downloads what it needs, about 5 to 10 minutes)
- About 1 GB of free disk space

After the first start, RideWave also works offline (except the road routes on the ML Lab map, which come from the internet).

## Start it (every time)
1. Open the `ridewave-app` folder.
2. Double-click **`RUN_RIDEWAVE.bat`**.
3. A menu appears. Press **1** (or just wait 15 seconds).
4. The app opens in your browser at http://127.0.0.1:5173

The backend and frontend run in two **minimised** windows on the taskbar. Do not close them while you use the app.

### What happens on the first start
The black window shows each step. Just wait until the browser opens.
1. If the laptop has no Node.js, a private copy is downloaded into the folder `.runtime` (about 30 MB, no admin rights needed).
2. The app packages are installed (`npm install`, a few minutes).
3. The built-in database downloads MongoDB once (about 70 MB).
4. The demo accounts below are created automatically.

If Windows asks about the firewall for Node.js, click **Allow** (Private networks).

## Start menu options
| Key | Option | Use it for |
|---|---|---|
| 1 | Quick start | Normal use on the laptop |
| 2 | Faculty demo | Starts the app and opens the ML Lab (log in as Admin) |
| 3 | Phone demo, same Wi-Fi | Phones on the same Wi-Fi or on the laptop's hotspot. The window prints the link to type on the phone. |
| 4 | Phone demo, public link | Phones on mobile data. Gives a temporary https link. Use this when the driver's live location must work on a phone. |
| 5 | Stop RideWave | Closes all RideWave servers |
| 6 | More tools | Checks, reset demo accounts, save work, database switch, share zip |
| 0 | Exit | |

## Demo accounts
All of these exist automatically on a fresh copy.

| Role | Email | Password | Opens on |
|---|---|---|---|
| Admin | admin@ridewave.app | Admin@123 | Admin panel (ML Lab is in its menu) |
| Driver | driver@test.com | drive123 | Driver dashboard |
| Passenger | passenger@test.com | pass123 | Passenger home |
| Passenger 2 | passenger2@test.com | pass456 | Passenger home |

Any login page works for every account; each one opens its own screen.

The driver account has a car: Maruti Swift, GJ 03 AB 1234, 5 seats.

If a password was changed and no longer works: `RUN_RIDEWAVE.bat` → 6 (More tools) → 4 (Create demo accounts). This resets all four to the passwords above.

### Trying a full ride
1. Open two browser windows (one normal, one Incognito/InPrivate).
2. Window 1: log in as **Driver** and switch to **Online**.
3. Window 2: log in as **Passenger** and book a ride.
4. The driver accepts, the passenger reads the 4-digit OTP to start the ride, then the driver completes it.
5. For pooling, book from **Passenger 2** in a third window on a similar route within 2 minutes.

## Online payment (test mode only)
Online payment works only when `backend\.env` has the Razorpay **test** keys. Cash rides always work.
- Card that succeeds: `5267 3181 8797 5449`, any future expiry, any CVV, OTP `1234` if asked
- Card that fails: `4000 0000 0000 0002`
- UPI: `success@razorpay` or `failure@razorpay`

No real money is ever charged in test mode.

## Sharing the project with a teammate
1. `RUN_RIDEWAVE.bat` → 6 (More tools) → **16 (Make a zip to share)**.
2. Answer **y** to include your `backend\.env` (Razorpay test keys) or **n** to leave it out.
3. A file `RideWave-share-<date>.zip` is made next to the project folder, and Explorer opens on it.
4. Send that zip. The teammate unzips it and double-clicks `RUN_RIDEWAVE.bat`. That is all.

Do not zip the folder by hand with right-click: that copies `node_modules` (hundreds of MB of files) and your personal database.

Each laptop has its **own** database. Rides booked on one laptop do not appear on another.

## If something goes wrong
| Problem | Fix |
|---|---|
| Browser shows "Database not connected" | First start is still downloading MongoDB. Keep the internet on and wait 2 to 3 minutes, then refresh. |
| "Port 5000 / 5173 is already in use" | Start menu → 5 (Stop), then start again. |
| Blank or broken page | Press Ctrl + Shift + R in the browser. If it stays broken: Start menu → 6 → 8 (Reinstall packages). |
| Phone cannot open the link | Phone and laptop must be on the same Wi-Fi (or the phone on the laptop's hotspot). Otherwise use option 4. |
| Want to see an error message | Click the minimised "RideWave Backend" or "RideWave Frontend" window on the taskbar. The backend log is also saved in `backend\logs\server.log`. |
| Want a completely fresh database | Stop RideWave, delete the folder `backend\.localdb`, start again. Demo accounts are recreated. |

## For developers (manual start)
```bat
cd backend
npm install
npm run dev        :: http://localhost:5000/api/health

cd frontend
npm install
npm run dev        :: http://127.0.0.1:5173
```
Checks: More tools → 3 (tests, lint and build).
