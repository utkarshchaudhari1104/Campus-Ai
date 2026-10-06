@echo off
echo ========================================
echo  CampusAI - Frontend Setup and Start
echo ========================================

cd /d "%~dp0"

IF NOT EXIST "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting frontend...
echo Frontend: http://localhost:5173
echo.
npm run dev
