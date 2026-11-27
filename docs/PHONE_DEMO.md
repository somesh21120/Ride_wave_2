# Phone demo (local only)

RideWave runs entirely on the laptop: backend, built-in database and frontend. Nothing is pushed to GitHub or hosted in the cloud. Phones reach the laptop in one of two ways.

## Start it
The phone demo feature. It:
1. starts the backend if it is not running (built-in local database);
2. builds the frontend and serves it on port **4173** (window "RideWave Phone Demo");
3. prints the addresses phones can open;
4. optionally opens a public https link (window "RideWave Public Link").

Stop everything with option **2**.

## Way 1: same network (recommended for the review)
- Turn on **Mobile hotspot** on the laptop (Windows Settings > Network > Mobile hotspot), or put the laptop and phones on the same Wi-Fi.
- On each phone open `http://<laptop-ip>:4173` (the tools window prints the exact address).
- First time only: if Windows asks whether Node.js may use the network, allow **Private networks**. If phones cannot open the page, the hotspot/Wi-Fi network may be set to Public; switch it to Private in Windows network settings.
- Limit: phones block location access on plain `http` addresses, so the driver's live location from a phone does not work this way. Use the laptop as the driver, or Way 2.
- College Wi-Fi often blocks phone-to-laptop traffic. The laptop hotspot avoids that and needs no internet except for map tiles.

## Way 2: temporary public link (phones on mobile data, reviewers' own phones)
- Uses Cloudflare's free quick tunnel (`cloudflared`, installed once by option 15 through winget, no account). It forwards traffic to the laptop; the app and data stay on the laptop.
- The link looks like `https://<random-words>.trycloudflare.com`, is https (so phone location works), changes every time, and works only while the laptop is on and the window is open.
- Needs internet on the laptop. Do a dry run before the review; if the college network blocks it, use the laptop on a phone hotspot.

## Demo checklist (morning of the review)
1. Laptop charged and plugged in, sleep disabled.
2. Option 1 (start), then option 15 (phone demo).
3. Log in once on each phone: passenger on one, driver on another, admin on the laptop.
4. Book one ride end to end before the reviewers arrive.
5. Backup: the recorded demo video.

## Why local only works technically
- The frontend calls `/api` and `/socket.io` on the same address it was loaded from; Vite (dev and preview) proxies both to the backend on port 5000. So the same build works on the laptop, over Wi-Fi and through the tunnel without changing any setting.
- `vite.config.js`: `host: true` (listen on the network), `allowedHosts: true` (accept the tunnel address), proxy for `/api` and `/socket.io` (with WebSockets).
