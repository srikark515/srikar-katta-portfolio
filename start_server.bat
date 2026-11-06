@echo off
title Smooth Scroll Frame Sequence Server
cd /d "%~dp0"

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python...
    python server.py
    pause
    exit /b
)

if exist "C:\Program Files\Comfy Desktop\resources\bootstrap-python\python.exe" (
    echo Starting server with Comfy Python...
    "C:\Program Files\Comfy Desktop\resources\bootstrap-python\python.exe" server.py
    pause
    exit /b
)

echo Starting server with PowerShell HttpListener...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause

