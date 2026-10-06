@echo off
echo ========================================
echo  CampusAI - Backend Setup and Start
echo ========================================

cd /d "%~dp0"

IF NOT EXIST "venv\Scripts\activate" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt --quiet

echo Seeding database...
python seed.py

echo.
echo Starting backend server...
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
uvicorn main:app --reload --port 8000
