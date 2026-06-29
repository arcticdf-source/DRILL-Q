@echo off
chcp 65001 > nul
title DRILL-Q

cd /d "%~dp0"

set PORT=3000

where node >nul 2>&1
if errorlevel 1 goto try_python

echo Starting DRILL-Q...
start "DRILL-Q Server" cmd /c "npx serve . -l %PORT% --no-clipboard 2>&1 & pause"
timeout /t 3 /nobreak > nul
start "" http://localhost:%PORT%/index.html
goto end

:try_python
where py >nul 2>&1
if not errorlevel 1 (
  echo Starting with Python...
  start "DRILL-Q Server" cmd /c "py -m http.server %PORT% & pause"
  timeout /t 2 /nobreak > nul
  start "" http://localhost:%PORT%/index.html
  goto end
)

where python3 >nul 2>&1
if not errorlevel 1 (
  echo Starting with Python3...
  start "DRILL-Q Server" cmd /c "python3 -m http.server %PORT% & pause"
  timeout /t 2 /nobreak > nul
  start "" http://localhost:%PORT%/index.html
  goto end
)

echo ERROR: Node.js or Python not found.
echo Download Node.js: https://nodejs.org
pause
exit /b 1

:end
echo Opened at http://localhost:%PORT%
timeout /t 5 /nobreak > nul
