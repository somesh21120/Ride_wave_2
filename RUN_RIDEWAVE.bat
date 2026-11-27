@echo off
setlocal EnableExtensions
title RideWave Launcher
cd /d "%~dp0"

rem A private copy of Node.js (downloaded automatically if the computer has none)
if exist "%~dp0.runtime\node\node.exe" set "PATH=%~dp0.runtime\node;%PATH%"

set "OPEN_URL=http://127.0.0.1:5173"
set "FROM_TOOLS="
rem RIDEWAVE_TOOLS.bat option 1 calls this file with "quick": skip the menu
if /i "%~1"=="quick" (
  set "FROM_TOOLS=1"
  goto :quick
)

:start_menu
cls
echo ============================================
echo   RideWave 2.0 - how do you want to start?
echo ============================================
echo   1. Quick start on this laptop (same as before)
echo   2. Faculty demo: quick start and open the ML Lab (admin)
echo   3. Phone demo: phones on the same Wi-Fi or this laptop's hotspot
echo   4. Phone demo: public link for phones on mobile data
echo   5. Stop RideWave
echo   6. More tools (checks, demo accounts, save work, database...)
echo   0. Exit
echo ============================================
echo   Nothing pressed in 15 seconds = option 1 (quick start).
echo.
choice /c 1234560 /n /t 15 /d 1 /m "Press a number: "
if errorlevel 7 exit /b 0
if errorlevel 6 goto :open_tools
if errorlevel 5 goto :stop_all
if errorlevel 4 goto :phone_public
if errorlevel 3 goto :phone_wifi
if errorlevel 2 goto :faculty
goto :quick

:faculty
set "OPEN_URL=http://127.0.0.1:5173/admin/ml-lab"
goto :quick

:phone_wifi
call "%~dp0RIDEWAVE_TOOLS.bat" phone
echo.
echo Keep this laptop on and awake during the demo. To stop, run this file and choose 5.
pause
exit /b 0

:phone_public
call "%~dp0RIDEWAVE_TOOLS.bat" phonepublic
echo.
echo Keep this laptop on and awake during the demo. To stop, run this file and choose 5.
pause
exit /b 0

:open_tools
call "%~dp0RIDEWAVE_TOOLS.bat"
exit /b 0

:stop_all
echo Stopping RideWave servers...
taskkill /FI "WINDOWTITLE eq RideWave Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RideWave Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RideWave Phone Demo*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq RideWave Public Link*" /T /F >nul 2>&1
echo Done. (If a server window is still open, just close it.)
timeout /t 3 /nobreak >nul
goto :start_menu

:quick
cls
echo ============================================
echo   RideWave 2.0 - starting the project
echo ============================================
echo.

rem ---- 1. Node.js installed? ----
where node >nul 2>&1
if errorlevel 1 goto :no_node
:after_node

rem ---- 2. Secret settings file present? ----
if not exist "backend\.env" goto :no_env

rem ---- 3. Packages installed? (first run only) ----
:after_env
rem A package added later (e.g. the local database) also triggers an install
if exist "backend\node_modules\mongodb-memory-server-core" goto :be_ok
echo [setup] Installing backend packages (first run, or new packages were added)...
pushd backend
call npm install
popd
:be_ok
if exist "frontend\node_modules\recharts" goto :fe_ok
echo [setup] Installing frontend packages (first run, or new packages were added)...
pushd frontend
call npm install
popd
:fe_ok

rem ---- 4. Local MongoDB running? (only if .env points to this computer) ----
findstr /i "MONGO_URI" "backend\.env" | findstr /i "127.0.0.1 localhost" >nul 2>&1
if errorlevel 1 goto :mongo_ok
sc query MongoDB 2>nul | find "RUNNING" >nul
if not errorlevel 1 goto :mongo_ok
echo [db] Local MongoDB is not running. Trying to start it...
net start MongoDB >nul 2>&1
sc query MongoDB 2>nul | find "RUNNING" >nul
if not errorlevel 1 goto :mongo_ok
echo.
echo [db] Could not start MongoDB automatically.
echo      Fix: right-click RUN_RIDEWAVE.bat and choose "Run as administrator",
echo      or open the Windows "Services" app and start "MongoDB Server".
echo      Continuing anyway; the backend will show an error if the database is down.
echo.
:mongo_ok

rem ---- 5. Backend ----
curl -s -o nul http://localhost:5000/api/health >nul 2>&1
if not errorlevel 1 (
  echo [backend] Already running on port 5000.
  goto :start_frontend
)
echo [backend] Starting on http://localhost:5000 ...
start "RideWave Backend" /MIN /D "%~dp0backend" cmd /k npm run dev

:start_frontend
curl -s -o nul http://127.0.0.1:5173 >nul 2>&1
if not errorlevel 1 (
  echo [frontend] Already running on port 5173.
  goto :wait_backend
)
echo [frontend] Starting on http://127.0.0.1:5173 ...
start "RideWave Frontend" /MIN /D "%~dp0frontend" cmd /k npm run dev

rem ---- 6. Wait until both answer, then open the browser ----
:wait_backend
echo.
echo Waiting for the servers to be ready...
set /a tries=0
:loop_backend
curl -s -o nul http://localhost:5000/api/health >nul 2>&1
if not errorlevel 1 goto :check_db
set /a tries+=1
if %tries% GEQ 45 goto :backend_down
timeout /t 2 /nobreak >nul
goto :loop_backend

rem ---- Backend is up; is the database connected? (waits up to ~40 s) ----
:check_db
echo [backend] API is up. Checking the database connection...
set /a dbtries=0
:loop_db
curl -s http://localhost:5000/api/health 2>nul | findstr /r /c:"db.:.connected" >nul
if not errorlevel 1 (
  echo [db] Database connected.
  goto :wait_frontend
)
set /a dbtries+=1
if %dbtries% GEQ 20 goto :db_down
timeout /t 2 /nobreak >nul
goto :loop_db

:db_down
echo.
echo [db] WARNING: the API is running but the database is NOT connected yet.
echo      Login, booking and admin will show "Database not connected" until it is.
echo      The Pooling Lab (/lab) works without the database.
call :show_log
findstr /i /r /c:"^MONGO_URI=local" "backend\.env" >nul 2>&1
if not errorlevel 1 (
  echo      You use the built-in local database. The FIRST start downloads MongoDB
  echo      ^(about 70 MB^) and can take a few minutes. Keep the internet on and wait;
  echo      the backend connects by itself. Later starts work offline in seconds.
  echo.
  goto :wait_frontend
)
echo      Most common fixes for MongoDB Atlas:
echo        1. cloud.mongodb.com - Network Access - Add Current IP Address
echo        2. cloud.mongodb.com - if the cluster says Paused, click Resume
echo        3. College Wi-Fi blocking it: switch to a phone hotspot
echo      The backend keeps retrying every 10 s, no need to restart.
echo.

:wait_frontend
set /a tries=0
:loop_frontend
curl -s -o nul http://127.0.0.1:5173 >nul 2>&1
if not errorlevel 1 goto :ready
set /a tries+=1
if %tries% GEQ 45 goto :frontend_down
timeout /t 2 /nobreak >nul
goto :loop_frontend

:ready
echo.
echo ============================================
echo   RideWave is running
echo   App:     http://127.0.0.1:5173
echo   Health:  http://localhost:5000/api/health
echo.
echo   Demo logins (after "Create demo accounts" in RIDEWAVE_TOOLS.bat):
echo     Admin      admin@ridewave.app   / Admin@123
echo     Driver     driver@test.com      / drive123
echo     Passenger  passenger@test.com   / pass123
echo.
echo   On a phone: run RUN_RIDEWAVE.bat again and choose 3 or 4.
echo.
echo   The two servers run in minimised windows on the taskbar.
echo   To stop: run RUN_RIDEWAVE.bat again and choose 5.
echo ============================================
if /i not "%OPEN_URL%"=="http://127.0.0.1:5173" (
  echo.
  echo   Faculty demo: log in as Admin. If the ML Lab does not open by itself,
echo   click "ML Lab" in the admin menu.
  echo   Use "Explain it step by step" at the top of the ML Lab.
)
start "" "%OPEN_URL%"
echo.
echo This window can be closed.
pause
exit /b 0

:backend_down
echo.
echo [backend] The backend did not start on port 5000.
call :show_log
echo      Open the "RideWave Backend" window from the taskbar and read the red text.
echo      If it says the port is in use, run RIDEWAVE_TOOLS.bat option 2 (Stop), then start again.
pause
exit /b 1

:frontend_down
echo.
echo [frontend] The frontend did not start on port 5173.
echo      Open the "RideWave Frontend" window from the taskbar and read the red text.
echo      If packages are broken, run RIDEWAVE_TOOLS.bat option 8 (Reinstall packages).
pause
exit /b 1

rem ---- Print the last lines of backend\logs\server.log ----
:show_log
if not exist "backend\logs\server.log" goto :eof
echo.
echo      ---- last lines of backend\logs\server.log ----
powershell -NoProfile -Command "Get-Content -Path 'backend\logs\server.log' -Tail 12" 2>nul
echo      ----------------------------------------------
echo.
goto :eof

:no_node
echo [setup] Node.js is not installed on this computer.
echo [setup] Downloading a private copy into this folder (about 30 MB, one time only, no admin needed)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\get-node.ps1"
if not exist "%~dp0.runtime\node\node.exe" goto :node_fail
set "PATH=%~dp0.runtime\node;%PATH%"
echo [setup] Node.js is ready.
goto :after_node

:node_fail
echo.
echo Could not download Node.js (check the internet connection and try again).
echo Or install the LTS version from https://nodejs.org and run this again.
pause
exit /b 1

:no_env
echo backend\.env is missing. Creating it from backend\.env.example ...
copy "backend\.env.example" "backend\.env" >nul 2>&1
if not exist "backend\.env" (
  echo Could not create backend\.env. Copy backend\.env.example to backend\.env by hand.
  pause
  exit /b 1
)
echo Created. It uses the built-in local database (MONGO_URI=local): nothing to install.
goto :after_env
