@echo off
echo ===================================
echo Virtual Input System Startup Script
echo ===================================
echo.
echo Installing dependencies...
echo -----------------------------------

cd server
call npm install
cd ..

cd client
call npm install
cd ..

echo.
echo Starting services...
echo -----------------------------------

echo Starting server...
start cmd /k "cd server && npm start"
timeout /t 2

echo Starting client...
start cmd /k "cd client && npm start"

echo.
echo ===================================
echo Services are starting up:
echo -----------------------------------
echo Server: The server will show its IP and port (default: http://[YOUR-IP]:8080)
echo Client: http://localhost:3000
echo.
echo Note: 
echo - Wait for both services to fully start
echo - Use the client URL in your browser
echo - The server IP will be shown in the server window
echo ===================================
echo.
echo Press any key to exit this window...
pause >nul