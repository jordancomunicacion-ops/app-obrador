@echo off
chcp 65001 >nul
setlocal
title SOTOdelPRIOR - Despliegue App Cocina
cd /d "%~dp0"

set APP_NAME=App Cocina
set REMOTE_USER=root
set REMOTE_HOST=164.92.167.42
set REMOTE_PATH=/root/SOTOdelPRIOR/apps/cocina
set ARCHIVE=deploy.tar.gz

echo ============================================================
echo   DESPLIEGUE %APP_NAME% (SOTO DEL PRIOR)
echo   Servidor: %REMOTE_USER%@%REMOTE_HOST%
echo   Ruta:     %REMOTE_PATH%
echo ============================================================
echo.

echo [1/4] Empaquetando %APP_NAME%...
tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude=".idea" --exclude=".vscode" --exclude=".claude" --exclude="dist" --exclude="build" --exclude="db_data" --exclude="cocina_db_data" --exclude="*.log" --exclude="docker-compose.override.yml" --exclude="%ARCHIVE%" -czf %ARCHIVE% .
if errorlevel 1 goto :error

echo.
echo [2/4] Subiendo paquete al servidor...
scp %ARCHIVE% %REMOTE_USER%@%REMOTE_HOST%:/root/deploy_cocina.tar.gz
if errorlevel 1 goto :error

echo.
echo [3/4] Limpiando despliegue anterior e instalando...
ssh %REMOTE_USER%@%REMOTE_HOST% "mkdir -p %REMOTE_PATH% && cd %REMOTE_PATH% && find . -mindepth 1 -maxdepth 1 ! -name 'db_data' ! -name 'cocina_db_data' -exec rm -rf {} + && tar -xzf /root/deploy_cocina.tar.gz > /dev/null && (mv .env.production .env 2>/dev/null || true) && sed -i 's/\r$//' setup_remote.sh && bash setup_remote.sh"
if errorlevel 1 goto :error

echo.
echo [4/4] Limpiando local...
del %ARCHIVE%

echo.
echo ============================================================
echo   [OK] DESPLIEGUE %APP_NAME% COMPLETADO
echo ============================================================
pause
endlocal
exit /b 0

:error
echo.
echo ============================================================
echo   [ERROR] El despliegue de %APP_NAME% ha fallado.
echo   Revisa el mensaje anterior.
echo ============================================================
if exist %ARCHIVE% del %ARCHIVE%
pause
endlocal
exit /b 1
