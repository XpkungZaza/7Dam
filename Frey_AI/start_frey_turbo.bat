@echo off
title Frey AI Turbo Launcher (RTX 4050)
echo ==========================================================
echo  ⚡ FREY AI TURBO SPEED LAUNCHER
echo ==========================================================
set OLLAMA_LLM_LIBRARY=vulkan
start /B "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
timeout /t 2 /nobreak >nul
start /B "" python "%~dp0api_server.py"
echo [OK] Ollama (Vulkan GPU) and Python API Server running!
echo You can now use Frey AI in the Web Dashboard.
pause
