@echo off
setlocal EnableExtensions
title RideWave
cd /d "%~dp0"

rem ---- 1. Use private Node.js if available ----
if exist "%~dp0.runtime\node\node.exe" set "PATH=%~dp0.runtime\node;%PATH%"

rem ---- 2. Download Node.js if missing ----
where node >nul 2>&1
if errorlevel 1 (
  echo [setup] Node.js not found. Downloading a private copy...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\get-node.ps1"
  if not exist "%~dp0.runtime\node\node.exe" (
    echo [setup] Download failed. Install Node.js LTS from https://nodejs.org and try again.
    pause
    exit /b 1
  )
  set "PATH=%~dp0.runtime\node;%PATH%"
)

rem ---- 3. Create .env if missing ----
if not exist "backend\.env" (
  echo [setup] Creating backend\.env from .env.example ...
  copy "backend\.env.example" "backend\.env" >nul 2>&1
)

rem ---- 4. Install packages if needed ----
if not exist "backend\node_modules\mongodb-memory-server-core" (
  echo [setup] Installing backend packages...
  pushd backend
  call npm install
  popd
)
if not exist "frontend\node_modules\recharts" (
  echo [setup] Installing frontend packages...
  pushd frontend
  call npm install
  popd
)

rem ---- 5. Start backend ----
curl -s -o nul http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
  echo [backend] Starting on port 5000...
  start "RideWave Backend" /MIN /D "%~dp0backend" cmd /k npm run dev
) else (
  echo [backend] Already running.
)

rem ---- 6. Start frontend ----
curl -s -o nul http://127.0.0.1:5173 >nul 2>&1
if errorlevel 1 (
  echo [frontend] Starting on port 5173...
  start "RideWave Frontend" /MIN /D "%~dp0frontend" cmd /k npm run dev
) else (
  echo [frontend] Already running.
)

rem ---- 7. Wait for servers, then open browser ----
echo.
echo Waiting for servers to be ready...
set /a tries=0
:wait_backend
curl -s -o nul http://localhost:5000/api/health >nul 2>&1
if not errorlevel 1 goto :wait_frontend
set /a tries+=1
if %tries% GEQ 45 (
  echo [backend] Did not start. Open the "RideWave Backend" window on the taskbar.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto :wait_backend

:wait_frontend
set /a tries=0
:wait_fe
curl -s -o nul http://127.0.0.1:5173 >nul 2>&1
if not errorlevel 1 goto :ready
set /a tries+=1
if %tries% GEQ 30 (
  echo [frontend] Did not start. Open the "RideWave Frontend" window on the taskbar.
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul
goto :wait_fe

:ready
echo.
echo ============================================
echo   RideWave is running
echo   App:     http://127.0.0.1:5173
echo   Health:  http://localhost:5000/api/health
echo ============================================
echo.
start "" http://127.0.0.1:5173
echo This window can be closed. The servers run in minimised windows on the taskbar.
echo To stop, run this file again or close those windows.
echo.
pause
