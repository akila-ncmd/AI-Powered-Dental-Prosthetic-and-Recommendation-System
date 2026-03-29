@echo off
echo ====================================================
echo  System Repair Tool: Rebuilding Python Environments
echo ====================================================
echo.

echo [1/2] Rebuilding FastAPI Backend Environment...
cd DentalAI-Backend
if exist "venv" (
    echo Deleting old corrupted venv...
    rmdir /s /q venv
)
echo Creating fresh venv for Python 3.13+...
python -m venv venv
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
echo Installing updated requirements...
pip install -r requirements.txt
cd ..

echo.
echo [2/2] Rebuilding Flask PDF API Environment...
cd pdf_api
if exist "venv" (
    echo Deleting old corrupted venv...
    rmdir /s /q venv
)
echo Creating fresh venv for Python 3.13+...
python -m venv venv
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
echo Installing updated requirements...
pip install -r requirements.txt
cd ..

echo.
echo Repair complete! Python environments have been completely re-built.
echo You can now run start-all.bat again.
pause
