@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo    Internship Portal - Automated Setup
echo ==========================================

:: 1. Backend Setup
echo [1/3] Setting up Backend...
cd backend
IF NOT EXIST .env (
    echo     - Creating .env from .env.example
    copy .env.example .env
)
echo     - Installing dependencies...
call npm install
cd ..

:: 2. Admin Portal Setup
echo [2/3] Setting up Admin Portal...
cd admin-portal
IF NOT EXIST .env (
    echo     - Creating .env from .env.example
    copy .env.example .env
)
echo     - Installing dependencies...
call npm install
cd ..

:: 3. Frontend Setup
echo [3/3] Setting up Frontend...
cd frontend
IF NOT EXIST .env (
    echo     - Creating .env from .env.example
    copy .env.example .env
)
echo     - Installing dependencies...
call npm install
cd ..

echo ==========================================
echo    Setup Complete!
echo ==========================================
echo IMPORTANT: Please update the newly created .env files 
echo in backend/, admin-portal/, and frontend/ with your 
echo actual credentials (DB URL, API Keys, JWT Secrets, etc.)
echo.
echo For the API email service, ensure the following are set in backend/.env:
echo EMAIL_SERVICE_URL
echo EMAIL_SERVICE_ATTACHMENT_URL
echo ==========================================
pause
