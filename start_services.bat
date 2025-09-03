@echo off
echo Starting RiskWorks Services...
echo.

echo Starting Backend Service...
start "backend" powershell -NoExit -Command "cd backend; python -m venv venv; venv\Scripts\Activate.ps1; pip install -q -r requirements.txt; python .\run.py"

echo Starting Frontend Service...
start "frontend" powershell -NoExit -Command "cd frontend; $host.UI.RawUI.WindowTitle = 'frontend'; npm run dev"

echo.
echo Services are starting in separate windows...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
