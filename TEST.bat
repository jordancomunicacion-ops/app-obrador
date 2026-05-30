@echo off
chcp 65001 >nul
setlocal
title SOTOdelPRIOR - Test local App Cocina
cd /d "%~dp0"

set APP_NAME=App Cocina
set LOCAL_URL=http://localhost:3002

echo ============================================================
echo   ENTORNO LOCAL %APP_NAME% (SOTO DEL PRIOR)
echo   URL: %LOCAL_URL%
echo ============================================================
echo.

echo [1/4] Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no detectado. Abre Docker Desktop.
    goto :error
)

echo [2/4] Verificando red proxy-net...
docker network inspect proxy-net >nul 2>&1
if errorlevel 1 (
    echo [INFO] Creando red 'proxy-net'...
    docker network create proxy-net
)

if not exist "docker-compose.yml" (
    echo [ERROR] No se encuentra docker-compose.yml en %cd%
    goto :error
)

echo [3/4] Levantando contenedores (build si hace falta)...
docker compose down
docker compose -f docker-compose.yml up --build -d
if errorlevel 1 goto :error

echo.
echo ============================================================
echo   [OK] Entorno %APP_NAME% en marcha
echo   Accede a: %LOCAL_URL%
echo   Migraciones manuales si hicieran falta:
echo     cd apps/web
echo     npx prisma migrate deploy
echo ============================================================
echo.

echo [4/4] Mostrando logs (Ctrl+C deja de mostrar; los contenedores siguen)...
docker compose logs -f
goto :eof

:error
pause
endlocal
exit /b 1
