@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: ── 读取 .env.local ──
set ENVFILE=%~dp0.env.local
if exist "%ENVFILE%" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%ENVFILE%") do (
        if "%%a"=="GEMINI_API_KEY" set GEMINI_KEY=%%b
    )
)

:: ── 设置 AI 后端环境变量 ──
if defined GEMINI_KEY (
    set AI_API_URL=https://generativelanguage.googleapis.com/v1beta/openai
    set AI_API_KEY=%GEMINI_KEY%
    set AI_DEFAULT_MODEL=gemini-2.5-flash-preview-05-20
) else (
    echo [提示] 未找到 GEMINI_API_KEY，将使用后端默认配置
)

:: 如果需要代理访问 Google API，取消注释下一行
:: set HTTPS_PROXY=http://127.0.0.1:7897

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未安装 Node.js
    pause
    exit /b
)

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未安装 Python
    pause
    exit /b
)

:: Check dependencies
if not exist "node_modules" (
    echo [安装] 前端依赖...
    call npm install
)

if exist "backend\requirements.txt" (
    echo [安装] 后端依赖...
    python -m pip install -q -r backend\requirements.txt
)

cls
echo ========================================================
echo   DocuGen AI 本地启动
echo ========================================================
echo.
if defined GEMINI_KEY (
    echo   API: Gemini OpenAI 兼容端点
    echo   Key: %GEMINI_KEY:~0,8%...
    echo   模型: gemini-2.5-flash-preview-05-20
) else (
    echo   API: 默认配置（公司网关）
)
echo.
echo   [1] 后端: http://127.0.0.1:8001
echo   [2] 前端: http://localhost:9000
echo   [3] 管理员: admin / Pretty74@
echo.
echo   关闭此窗口不影响运行
echo ========================================================
echo.

:: Start Python backend (new window, inherits env vars)
start "DocuGen-Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

:: Wait for backend to start
timeout /t 2 /nobreak >nul

:: Start Vite frontend (current window, auto-open browser)
call npm run dev -- --open

pause
