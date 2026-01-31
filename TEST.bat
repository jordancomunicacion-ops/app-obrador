@echo off
setlocal

echo [DEBUG] Script de inicio ejecutandose...

:: Verificar si docker esta disponible
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no detectado. Asegurate de que Docker Desktop este abierto.
    pause
    exit /b
)

echo [INFO] Verificando red proxy-net...
docker network inspect proxy-net >nul 2>&1
if errorlevel 1 (
    echo [INFO] Red 'proxy-net' no encontrada. Creandola...
    docker network create proxy-net
) else (
    echo [INFO] Red 'proxy-net' existe.
)

if not exist "docker-compose.yml" (
    echo [ERROR] No se encuentra "docker-compose.yml" en este directorio: %cd%
    pause
    exit /b
)

echo [INFO] docker-compose.yml encontrado.
echo [INFO] Deteniendo contenedores previos...
docker compose down

echo [INFO] Levantando entorno (construyendo si es necesario)...
docker compose up --build -d

if errorlevel 1 (
    echo [ERROR] Hubo un problema al levantar los contenedores.
    pause
    exit /b
)

echo.
echo ======================================================
echo [INFO] Contenedores Docker en marcha.
echo [INFO] ACCEDE AQUI: http://localhost:3002
echo [INFO] Nota: El login te redirigira correctamente a localhost.
echo [INFO] Para ejecutar migraciones manualmente si es necesario:
echo cd apps/web
echo npx prisma migrate deploy
echo ======================================================
echo.

echo [INFO] Mostrando logs (Presiona Ctrl+C para dejar de ver logs, los contenedores seguiran corriendo)...
docker compose logs -f

pause
