@echo off
setlocal EnableExtensions
title RideWave Tools
cd /d "%~dp0"

rem Use the private Node.js copy if there is one; download it if the computer has no Node.js
if exist "%~dp0.runtime\node\node.exe" set "PATH=%~dp0.runtime\node;%PATH%"
where node >nul 2>&1
if not errorlevel 1 goto :node_ok
echo Node.js is not installed. Downloading a private copy into this folder (one time only)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\get-node.ps1"
if exist "%~dp0.runtime\node\node.exe" set "PATH=%~dp0.runtime\node;%PATH%"
:node_ok

rem RUN_RIDEWAVE.bat options 3 and 4 jump straight to the phone demo
set "ONESHOT="
set "AUTO_PUB="
if /i "%~1"=="phone" (
  set "ONESHOT=1"
  set "AUTO_PUB=n"
  goto :phone
)
if /i "%~1"=="phonepublic" (
  set "ONESHOT=1"
  set "AUTO_PUB=y"
  goto :phone
)

:menu
if defined ONESHOT exit /b 0
cls
echo ============================================
echo   RideWave 2.0 - Tools
echo ============================================
echo   1. Start RideWave (opens the app)
echo   2. Stop RideWave
echo   3. Run all checks (tests, lint, build)
echo   4. Create demo accounts (admin, driver, passengers)
echo   5. Save my work (git commit)
echo   6. Save a checkpoint (run tag + backup)
echo   7. Show version history
echo   8. Reinstall packages
echo   9. Open health page
echo  10. Run pooling simulation (Sem 7 vs Sem 8 results)
echo  11. Switch pool matcher (proximity / corridor / smart AI)
echo  12. Train the AI pairing model (simulated data)
echo  13. Open the Pooling Lab page
echo  14. Switch database (local built-in / online Atlas)
echo  15. Phone demo (open RideWave on phones: same Wi-Fi or a public link)
echo  16. Make a zip to share with a teammate
echo   0. Exit
echo ============================================
set "choice="
set /p choice=Type a number and press Enter: 
if "%choice%"=="1" goto :start
if "%choice%"=="2" goto :stop
if "%choice%"=="3" goto :checks
if "%choice%"=="4" goto :seed
if "%choice%"=="5" goto :save
if "%choice%"=="6" goto :checkpoint
if "%choice%"=="7" goto :history
if "%choice%"=="8" goto :reinstall
if "%choice%"=="9" goto :health
if "%choice%"=="10" goto :simulate
if "%choice%"=="11" goto :matcher
if "%choice%"=="12" goto :train
if "%choice%"=="13" goto :lab
if "%choice%"=="14" goto :database
if "%choice%"=="15" goto :phone
if "%choice%"=="16" goto :sharezip
if "%choice%"=="0" exit /b 0
goto :menu

:start
call "%~dp0RUN_RIDEWAVE.bat" quick
goto :menu

:stop
echo Stopping RideWave servers...
taskkill /FI "WINDOWTITLE eq RideWave Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RideWave Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RideWave Phone Demo*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RideWave Public Link*" /T /F >nul 2>&1
echo Done. (If a server window is still open, just close it.)
pause
goto :menu

:checks
set "R_TEST=FAIL" & set "R_LINT=FAIL" & set "R_BUILD=FAIL"
echo.
echo ---- Backend tests ----
pushd backend
call npm test && set "R_TEST=PASS"
popd
echo.
echo ---- Frontend lint ----
pushd frontend
call npm run lint && set "R_LINT=PASS"
echo.
echo ---- Frontend build ----
call npm run build && set "R_BUILD=PASS"
popd
echo.
echo ============================================
echo   Tests: %R_TEST%    Lint: %R_LINT%    Build: %R_BUILD%
echo ============================================
pause
goto :menu

:seed
pushd backend
call node seedTestUsers.js
popd
echo.
echo Demo logins:
echo   Admin      admin@ridewave.app   / Admin@123
echo   Driver     driver@test.com      / drive123
echo   Passenger  passenger@test.com   / pass123
echo   Passenger  passenger2@test.com  / pass456
echo (Existing demo accounts get their passwords reset to the ones above.)
pause
goto :menu

:save
where git >nul 2>&1 || (echo Git is not installed. & pause & goto :menu)
git add -A
git diff --cached --name-only | findstr /i /r "\.env$" >nul
if not errorlevel 1 (
  echo STOP: a .env file with your secret keys was about to be saved. Removing it from the commit.
  for /f "delims=" %%f in ('git diff --cached --name-only ^| findstr /i /r "\.env$"') do git restore --staged "%%f"
)
echo.
echo Files that will be saved:
git status --short
echo.
set "msg="
set /p msg=Describe what changed (for example: fixed booking on phone): 
if "%msg%"=="" set "msg=update"
git commit -m "%msg%"
pause
goto :menu

:checkpoint
set "runid="
set /p runid=Run ID (for example R07): 
if "%runid%"=="" goto :menu
set "rtitle="
set /p rtitle=Short title (for example Browser check fixes): 
if "%rtitle%"=="" set "rtitle=Checkpoint"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run-checkpoint.ps1" -RunId "%runid%" -Title "%rtitle%"
pause
goto :menu

:history
git log --oneline --decorate -n 25
echo.
type VERSION
pause
goto :menu

:reinstall
pushd backend
call npm install
popd
pushd frontend
call npm install
popd
pause
goto :menu

:simulate
pushd backend
call node scripts\simulate-pooling.js
popd
echo.
echo Results saved in docs\results (pooling-simulation.md, .csv and .svg chart for slides).
start "" "%~dp0docs\results\pooling-simulation.svg"
pause
goto :menu

:matcher
echo Current setting:
findstr /i "POOL_MATCHER" "backend\.env" || echo   POOL_MATCHER not set, using proximity
echo.
echo   1. proximity  - Sem 7 rule, safest for demos
echo   2. corridor   - Sem 8 route-corridor matching
echo   3. smart      - Sem 8 corridor + AI ranking
set "m="
set /p m=Choose 1, 2 or 3: 
set "mode="
if "%m%"=="1" set "mode=proximity"
if "%m%"=="2" set "mode=corridor"
if "%m%"=="3" set "mode=smart"
if "%mode%"=="" goto :menu
findstr /v /i "POOL_MATCHER=" "backend\.env" > "backend\.env.tmp"
echo POOL_MATCHER=%mode%>> "backend\.env.tmp"
move /y "backend\.env.tmp" "backend\.env" >nul
echo Saved POOL_MATCHER=%mode%. Restart RideWave with option 2 then 1 to apply.
pause
goto :menu

:train
pushd backend
call node scripts\train-pairing-model.js
popd
echo.
echo Model saved to backend\ml\pairing-model.json, report in docs\results\ai-pairing-model.md
echo Restart RideWave so the app and the Pooling Lab use the new model.
pause
goto :menu

:lab
start "" http://127.0.0.1:5173/lab
goto :menu

:health
start "" http://localhost:5000/api/health
goto :menu

:database
echo Current database setting:
findstr /i /r /c:"^MONGO_URI=local" "backend\.env" >nul 2>&1 && echo   local built-in database || echo   online database, Atlas or other
echo.
echo   1. Local built-in database (works on any PC, no account, no phone access)
echo   2. Online MongoDB Atlas (needed for the hosted / phone demo)
set "d="
set /p d=Choose 1 or 2: 
if "%d%"=="1" goto :db_local
if "%d%"=="2" goto :db_atlas
goto :menu

:db_local
copy /y "backend\.env" "backend\.env.backup" >nul
findstr /v /i /r /c:"^MONGO_URI=" "backend\.env" > "backend\.env.tmp"
echo MONGO_URI=local>> "backend\.env.tmp"
move /y "backend\.env.tmp" "backend\.env" >nul
echo Saved MONGO_URI=local (old file kept as backend\.env.backup).
echo Restart RideWave (option 2, then 1). Demo accounts are created automatically.
pause
goto :menu

:db_atlas
echo Paste the Atlas connection string (starts with mongodb+srv://) and press Enter.
echo It is saved only in backend\.env on this computer.
set "uri="
set /p "uri=URI: "
if not defined uri goto :menu
setlocal EnableDelayedExpansion
rem Delayed expansion keeps the "&" characters of the connection string intact
if /i not "!uri:~0,7!"=="mongodb" (
  echo That does not look like a MongoDB connection string.
  endlocal
  pause
  goto :menu
)
copy /y "backend\.env" "backend\.env.backup" >nul
findstr /v /i /r /c:"^MONGO_URI=" "backend\.env" > "backend\.env.tmp"
>> "backend\.env.tmp" echo(MONGO_URI=!uri!
move /y "backend\.env.tmp" "backend\.env" >nul
endlocal
echo Saved (old file kept as backend\.env.backup).
echo Restart RideWave (option 2, then 1). An empty Atlas database gets the demo accounts automatically.
pause
goto :menu

rem ===================== 15. Phone demo =====================
rem Serves a production build of the app from this laptop on port 4173.
rem Phones on the same Wi-Fi or this laptop's hotspot open http://<laptop-ip>:4173.
rem Optional: a temporary public https link (Cloudflare quick tunnel, no account needed)
rem for phones on mobile data. The laptop must stay on and awake during the demo.
:phone
curl -s -o nul http://localhost:5000/api/health >nul 2>&1
if not errorlevel 1 goto :phone_build
echo [backend] Not running. Starting it...
start "RideWave Backend" /MIN /D "%~dp0backend" cmd /k npm run dev
timeout /t 8 /nobreak >nul

:phone_build
echo.
echo [phone] Building the app for phones (about 30 seconds)...
pushd frontend
call npm run build
if errorlevel 1 (
  popd
  echo Build failed. Run option 3 to see the error.
  pause
  goto :menu
)
popd
taskkill /FI "WINDOWTITLE eq RideWave Phone Demo*" /T /F >nul 2>&1
start "RideWave Phone Demo" /MIN /D "%~dp0frontend" cmd /k npm run preview -- --port 4173 --strictPort
timeout /t 4 /nobreak >nul

echo.
echo ============================================
echo   Phone demo is running on this laptop
echo   On this laptop:  http://127.0.0.1:4173
echo   On phones connected to the SAME Wi-Fi or to this laptop's hotspot:
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^(127|169\.254)' -and $_.PrefixOrigin -ne 'WellKnown' } | ForEach-Object { $_.IPAddress }"`) do echo     http://%%i:4173
echo   If Windows asks about the firewall for Node.js, allow Private networks.
echo   Note: phones block location on plain http links. For the driver's live
echo   location on a phone, use the public https link below.
echo ============================================
echo.
set "pub="
if defined AUTO_PUB set "pub=%AUTO_PUB%"
if not defined AUTO_PUB set /p pub=Also create a public https link for phones on mobile data? (y/n): 
if /i not "%pub%"=="y" goto :menu

set "CF="
where cloudflared >nul 2>&1 && set "CF=cloudflared"
if not defined CF if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set "CF=%ProgramFiles%\cloudflared\cloudflared.exe"
if not defined CF if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" set "CF=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
if defined CF goto :phone_tunnel
echo.
echo The free Cloudflare tunnel tool (cloudflared) is not installed.
set "inst="
set /p inst=Install it now with winget (official Cloudflare package)? (y/n): 
if /i not "%inst%"=="y" goto :menu
winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set "CF=%ProgramFiles%\cloudflared\cloudflared.exe"
if not defined CF if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" set "CF=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
if not defined CF (
  echo Installed, but this window cannot see it yet. Close RIDEWAVE_TOOLS, open it again and choose 15.
  pause
  goto :menu
)

:phone_tunnel
taskkill /FI "WINDOWTITLE eq RideWave Public Link*" /T /F >nul 2>&1
start "RideWave Public Link" cmd /k ""%CF%" tunnel --url http://127.0.0.1:4173"
echo.
echo A window "RideWave Public Link" opened. In about 10 seconds it shows a box with
echo a link ending in .trycloudflare.com. Open that link on any phone.
echo The link changes every time and works only while this laptop is on.
pause
goto :menu

rem ===================== 16. Share zip =====================
rem Zips the project WITHOUT node_modules, git history, the local database, logs and caches.
rem The receiver double-clicks RUN_RIDEWAVE.bat: Node.js and packages install automatically.
:sharezip
echo.
echo This makes RideWave-share-^<date^>.zip next to the project folder.
echo Left out: node_modules, git history, your local database, logs, caches.
echo.
echo Your backend\.env holds your settings, including the Razorpay TEST keys.
echo   y = include it (online test payments work on their computer too)
echo   n = leave it out (they get the default settings; cash rides work, online payment will not)
set "inc="
set /p inc=Include your backend\.env? (y/n): 
set "ENVFLAG="
if /i "%inc%"=="y" set "ENVFLAG=-IncludeEnv"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\make-share-zip.ps1" %ENVFLAG%
pause
goto :menu
