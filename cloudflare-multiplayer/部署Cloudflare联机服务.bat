@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ========================================
echo  终夜列车 - Cloudflare 联机服务部署
echo ========================================
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 Node.js 20 或更高版本。
  pause
  exit /b 1
)
echo [1/3] 安装 Wrangler...
call npm install
if errorlevel 1 goto :fail
echo [2/3] 登录 Cloudflare（浏览器会打开授权页）...
call npx wrangler login
if errorlevel 1 goto :fail
echo [3/3] 部署 Worker + Durable Object...
call npx wrangler deploy
if errorlevel 1 goto :fail
echo.
echo [完成] 请复制上方输出的 https://xxxx.workers.dev 地址，
echo        填入 ..\assets\js\multiplayer-config.js 的 serverUrl。
echo        然后将本补丁文件覆盖到 GitHub 仓库并 push。
pause
exit /b 0
:fail
echo.
echo [失败] 部署未完成，请根据上方错误信息处理后重试。
pause
exit /b 1
