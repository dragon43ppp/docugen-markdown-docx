@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [error] Node.js is not installed.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [error] Python is not installed.
    pause
    exit /b 1
)

python -c "import encodings, venv" >nul 2>nul
if %errorlevel% neq 0 (
    echo [error] The detected Python runtime cannot create virtual environments.
    echo [error] Please install a standard Python distribution and ensure it works outside this folder.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [setup] Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 goto :error
)

if not exist ".backend-venv\Scripts\python.exe" (
    echo [setup] Creating backend virtual environment...
    python -m venv .backend-venv
    if %errorlevel% neq 0 goto :error
)

echo [setup] Installing backend dependencies...
call ".backend-venv\Scripts\python.exe" -m pip install --upgrade pip >nul
call ".backend-venv\Scripts\python.exe" -m pip install -r backend\requirements.txt
if %errorlevel% neq 0 goto :error

if not defined DOCUGEN_OFFLINE_PDF_ROOT (
    if exist "%~dp0backend\offline_pdf_bundle" (
        set "DOCUGEN_OFFLINE_PDF_ROOT=%~dp0backend\offline_pdf_bundle"
    )
)

cls
echo ========================================================
echo   DocuGen Markdown DOCX
echo ========================================================
echo   Frontend: http://127.0.0.1:9000
echo   Backend : http://127.0.0.1:8001
echo.
echo   This public edition does not ship with any built-in API key.
echo   Configure your own OpenAI-compatible endpoint in the browser.
echo.
if defined DOCUGEN_OFFLINE_PDF_ROOT (
    echo   PDF engine: %DOCUGEN_OFFLINE_PDF_ROOT%
) else (
    echo   PDF engine: not configured
    echo   Set DOCUGEN_OFFLINE_PDF_ROOT to enable PDF -> Word.
)
echo ========================================================
echo.

start "DocuGen Open Backend" cmd /k "cd /d \"%~dp0backend\" && ..\.backend-venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"
timeout /t 2 /nobreak >nul
call npm run dev -- --host 127.0.0.1 --port 9000 --open
exit /b 0

:error
echo [error] Startup failed.
pause
exit /b 1
