@echo off
REM ===========================================================
REM  Phulpur24 — one-click dev server
REM  Double-click this file. It will:
REM    1. install dependencies if node_modules is missing
REM    2. start `npm run dev`
REM    3. open the admin login in your default browser
REM ===========================================================

setlocal
cd /d "%~dp0"

echo.
echo  Phulpur24 dev server
echo  ---------------------
echo  Project:  %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  ERROR: Node.js is not installed or not on PATH.
  echo  Download it from https://nodejs.org/ ^(LTS^).
  pause
  exit /b 1
)

if not exist node_modules (
  echo  Installing dependencies ^(first run only, ~1-2 minutes^)...
  call npm install
  if errorlevel 1 (
    echo  npm install failed. See the error above.
    pause
    exit /b 1
  )
)

echo  Starting dev server on http://localhost:3000 ...
echo  Opening your browser in 6 seconds.
echo  Press Ctrl+C in this window to stop the server.
echo.

start "" /b cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:3000/admin/login"

call npm run dev

pause
