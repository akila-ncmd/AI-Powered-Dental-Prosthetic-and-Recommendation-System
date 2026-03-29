@echo off
echo ====================================================
echo  Starting AI-Powered Dental System (Unified Run)
echo ====================================================
echo.

echo [1/3] Starting Next.js Frontend (Port 3000)...
start "Dental Frontend" cmd /k "npm run dev"

echo [2/3] Starting AI Backend (FastAPI - Port 8000)...
start "AI Backend" cmd /k "cd DentalAI-Backend && call .\venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo [3/3] Starting PDF Reporting API (Flask - Port 5000)...
start "PDF API" cmd /k "cd pdf_api && call .\venv\Scripts\activate.bat && python app.py"

echo.
echo All three services are launching in separate windows!
echo Keep those windows open to keep the servers running.
echo To stop the system, simply close those command prompt windows.
echo.
pause
