@echo off
cd /d "%~dp0"
echo Installing Doomsday Archive dependencies...
call npm install
echo Done. Use run.bat to start the app.
pause
