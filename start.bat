@echo off
title Doc Translate (localhost)
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js is not installed. Download the LTS version from https://nodejs.org, install it, then run this again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing packages - first run only, takes a minute or two...
  call npm install || goto :error
)
echo Starting Doc Translate at http://localhost:5173 ...
echo Close this window to stop it.
call npm run dev -- --open
goto :eof
:error
echo Something went wrong while installing. Scroll up for the error message.
pause
