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
3. The backend and frontend start automatically. Wait for the browser to open.
4. The app opens at http://127.0.0.1:5173

The backend and frontend run in two **minimised** windows on the taskbar. Do not close them while you use the app.

### What happens on the first start
The black window shows each step. Just wait until the browser opens.
1. If the laptop has no Node.js, a private copy is downloaded into the folder `.runtime` (about 30 MB, no admin rights needed).
2. The app packages are installed (`npm install`, a few minutes).
3. The built-in database downloads MongoDB once (about 70 MB).
4. The demo accounts below are created automatically.

If Windows asks about the firewall for Node.js, click **Allow** (Private networks).

## Demo accounts
All of these exist automatically on a fresh copy.

| Role | Email | Password | Vehicle |
|---|---|---|---|
| Admin | admin@ridewave.app | Admin@123 | — |
| Passenger | passenger@test.com | pass123 | — |
| Passenger 2 | passenger2@test.com | pass456 | — |
| Passenger 3 | passenger3@test.com | pass789 | — |
| Passenger 4 | passenger4@test.com | pass000 | — |
| Driver (Car) | driver@test.com | drive123 | Maruti Swift, GJ 03 AB 1234 |
| Driver (Auto) | driver-auto@test.com | drive123 | Bajaj RE, GJ 03 CD 5678 |
| Driver (Bike) | driver-bike@test.com | drive123 | Honda Activa, GJ 03 EF 9012 |

The car driver account has a Maruti Swift, GJ 03 AB 1234, 5 seats.
The auto driver account has a Bajaj RE, GJ 03 CD 5678, 4 seats.
The bike driver account has a Honda Activa, GJ 03 EF 9012, 2 seats.

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

## If something goes wrong
| Problem | Fix |
|---|---|
| Browser shows "Database not connected" | First start is still downloading MongoDB. Keep the internet on and wait 2 to 3 minutes, then refresh. |
| "Port 5000 / 5173 is already in use" | Close the existing RideWave Backend/Frontend windows on the taskbar, then run RUN_RIDEWAVE.bat again. |
| Blank or broken page | Press Ctrl + Shift + R in the browser. If it stays broken, run `cd frontend && npm install` then `npm run build`. |
| Want to see an error message | Click the minimised "RideWave Backend" or "RideWave Frontend" window on the taskbar. The backend log is also saved in `backend\logs\server.log`. |
| Want a completely fresh database | Stop RideWave, delete the folder `backend\.localdb`, start again. Demo accounts are recreated. |
