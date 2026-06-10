@echo off
echo ==============================================
echo       QFlow Project - Server Launcher
echo ==============================================
echo.
echo Starting Backend Server...
start "QFlow Backend" cmd /k "cd backend && npm run dev"

echo Starting Frontend Server...
start "QFlow Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo You can safely close this window.
pause
