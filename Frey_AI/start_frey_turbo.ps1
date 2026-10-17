# start_frey_turbo.ps1 - All-In-One Turbo Launcher for Project 7Dam & Frey AI
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "⚡ PROJECT 7DAM & FREY AI: TURBO ENGINE LAUNCHER (RTX 4050)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Set Vulkan GPU Environment Variable (Fixes CUDA kernel crash on mobile RTX 4050)
[System.Environment]::SetEnvironmentVariable("OLLAMA_LLM_LIBRARY", "vulkan", "Process")
[System.Environment]::SetEnvironmentVariable("OLLAMA_LLM_LIBRARY", "vulkan", "User")
$env:OLLAMA_LLM_LIBRARY = "vulkan"
Write-Host "[1/3] Configured GPU Backend: Vulkan (RTX 4050 Acceleration)" -ForegroundColor Yellow

# 2. Check if Ollama is running, if not start it
$ollamaProc = Get-Process *ollama* -ErrorAction SilentlyContinue
if (-not $ollamaProc) {
    Write-Host "[2/3] Starting Ollama background server..." -ForegroundColor Yellow
    Start-Process -FilePath "$($env:LOCALAPPDATA)\Programs\Ollama\ollama.exe" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[2/3] Ollama server is already running." -ForegroundColor Green
}

# 3. Start Python API Server on port 8000
Write-Host "[3/3] Starting Python API Server (port 8000)..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process -FilePath "python" -ArgumentList "$scriptDir\api_server.py" -WindowStyle Hidden

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "✅ All AI services online! Enjoy Turbo Speed." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
