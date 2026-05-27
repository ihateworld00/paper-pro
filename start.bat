@echo off
chcp 65001 >nul
title 论文通 - 启动中...

echo.
echo   ╔══════════════════════════════════╗
echo   ║     论文通 AI助手 正在启动      ║
echo   ╚══════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/3] 启动本地服务器...
start "论文通-服务器" /B npm run dev

echo [2/3] 等待服务器就绪...
:wait
curl -s -o nul http://localhost:3000 2>nul
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait
)
echo        服务器已就绪 ✓

echo [3/3] 启动 Cloudflare 隧道...
echo.
echo   ┌────────────────────────────────────────┐
echo   │  正在创建公网隧道，请稍等...            │
echo   └────────────────────────────────────────┘
echo.

npx cloudflared tunnel --url http://localhost:3000 2>&1 | findstr "trycloudflare.com"
