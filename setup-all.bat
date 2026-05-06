@echo off
setlocal enabledelayedexpansion

title APTRANSCO Internship Portal - Setup

echo.
echo ============================================================
echo   APTRANSCO Internship Portal - Automated Setup (Windows)
echo ============================================================
echo.

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"
cd /d "%ROOT_DIR%"

if not exist "backend\package.json" (
    echo [ERROR] backend\package.json not found.
    echo Run this script from the repository root.
    goto :fail
)
if not exist "frontend\package.json" (
    echo [ERROR] frontend\package.json not found.
    goto :fail
)
if not exist "admin-portal\package.json" (
    echo [ERROR] admin-portal\package.json not found.
    goto :fail
)

echo [CHECK] Verifying Node.js and npm...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Install Node.js 18+ from https://nodejs.org/
    goto :fail
)
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH.
    goto :fail
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [INFO] Node: !NODE_VERSION!
echo [INFO] npm : !NPM_VERSION!
echo.

call :setup_module "backend" "1/4"
if errorlevel 1 goto :fail

call :setup_module "frontend" "2/4"
if errorlevel 1 goto :fail

call :setup_module "admin-portal" "3/4"
if errorlevel 1 goto :fail

echo [4/4] Installing root dependencies...
if exist "package.json" (
    call npm install
    if errorlevel 1 (
        echo [ERROR] Root dependency installation failed.
        goto :fail
    )
) else (
    echo [WARN] Root package.json not found. Skipping root install.
)

echo.
echo ============================================================
echo   Setup completed successfully.
echo ============================================================
echo Next steps:
echo 1. Edit .env files in backend\, frontend\, and admin-portal\.
echo 2. Configure backend DATABASE_URL and JWT_SECRET.
echo 3. From backend\: run npx prisma db push
echo 4. Seed default accounts if needed:
echo    node scripts\seed-accounts.js
echo 5. Start all services from root:
echo    npm run dev
echo.
pause
exit /b 0

:setup_module
set "MODULE=%~1"
set "STEP=%~2"

echo [%STEP%] Setting up %MODULE%...
if not exist "%MODULE%" (
    echo [ERROR] Directory not found: %MODULE%
    exit /b 1
)

pushd "%MODULE%"

if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul
        if errorlevel 1 (
            echo [ERROR] Failed to create .env in %MODULE%.
            popd
            exit /b 1
        )
        echo [INFO] Created %MODULE%\.env from .env.example
    ) else (
        echo [WARN] .env.example not found in %MODULE%. Skipping .env creation.
    )
) else (
    echo [INFO] %MODULE%\.env already exists. Keeping existing file.
)

call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed in %MODULE%.
    popd
    exit /b 1
)

popd
echo [OK] %MODULE% setup complete.
echo.
exit /b 0

:fail
echo.
echo ============================================================
echo   Setup failed. Fix the error above and re-run setup-all.bat
echo ============================================================
echo.
pause
exit /b 1
