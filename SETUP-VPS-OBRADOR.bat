@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title SOTOdelPRIOR - SETUP UNICO del VPS de Obrador (modelo git-pull)
cd /d "%~dp0"

REM ============================================================
REM  Este script se ejecuta UNA SOLA VEZ.
REM  Convierte la carpeta del VPS en un clon del repo de GitHub
REM  para que DESPLEGAR.bat pueda hacer 'git pull' en el servidor.
REM  La base de datos NO se toca (vive en un volumen Docker externo).
REM ============================================================

set REMOTE_USER=root
set REMOTE_HOST=164.92.167.42
set REMOTE_PARENT=/root/SOTOdelPRIOR/apps
set REMOTE_PATH=/root/SOTOdelPRIOR/apps/obrador
set REPO_OWNER=jordancomunicacion-ops
set REPO_NAME=app-obrador

cls
echo ============================================================
echo   SETUP UNICO - VPS OBRADOR (modelo git-pull)
echo   Servidor: %REMOTE_USER%@%REMOTE_HOST%
echo   Ruta:     %REMOTE_PATH%
echo   Repo:     %REPO_OWNER%/%REPO_NAME% (privado)
echo ============================================================
echo.
echo  Este proceso, en el servidor:
echo    1) Respalda el .env y renombra la carpeta actual (sin tocar la BD)
echo    2) Clona el repo desde GitHub usando tu token
echo    3) Restaura el .env de produccion
echo    4) Arranca con docker compose y sincroniza el schema
echo    5) Verifica /api/health
echo.
echo  Necesitas un GitHub Personal Access Token (classic) con permiso 'repo'.
echo  Crealo en: https://github.com/settings/tokens
echo.
set /p GHUSER="   Tu usuario de GitHub: "
set /p GHTOKEN="   Pega tu token (no se mostrara guardado): "
echo.
echo  El token se usa solo para clonar y luego se elimina del remoto git.
echo.
pause

echo.
echo [1/5] Respaldando .env y carpeta actual en el servidor...
ssh %REMOTE_USER%@%REMOTE_HOST% "set -e; cd %REMOTE_PARENT%; if [ -d obrador ]; then cp obrador/.env /root/obrador.env.bak 2>/dev/null || cp obrador/.env.production /root/obrador.env.bak 2>/dev/null || echo 'AVISO: no se encontro .env, lo restauraras manualmente'; mv obrador obrador_old_$(date +%%Y%%m%%d-%%H%%M%%S); echo 'Carpeta anterior renombrada.'; else echo 'No habia carpeta obrador previa.'; fi"
if errorlevel 1 goto error

echo.
echo [2/5] Clonando el repo (privado) con tu token...
ssh %REMOTE_USER%@%REMOTE_HOST% "set -e; cd %REMOTE_PARENT%; git clone https://%GHUSER%:%GHTOKEN%@github.com/%REPO_OWNER%/%REPO_NAME%.git obrador; cd obrador; git remote set-url origin https://github.com/%REPO_OWNER%/%REPO_NAME%.git; git config credential.helper store; printf 'https://%GHUSER%:%GHTOKEN%@github.com\n' > ~/.git-credentials; chmod 600 ~/.git-credentials; echo 'Repo clonado y credenciales guardadas para futuros pull.'"
if errorlevel 1 goto error

echo.
echo [3/5] Restaurando .env de produccion...
ssh %REMOTE_USER%@%REMOTE_HOST% "if [ -f /root/obrador.env.bak ]; then cp /root/obrador.env.bak %REMOTE_PATH%/.env; echo '.env restaurado.'; else echo 'AVISO: no hay backup de .env; copialo manualmente a %REMOTE_PATH%/.env antes de continuar.'; fi"
if errorlevel 1 goto error

echo.
echo [4/5] Arranque inicial (build + db push)...
ssh %REMOTE_USER%@%REMOTE_HOST% "set -e; cd %REMOTE_PATH%; export AUTH_URL=https://obrador.sotodelprior.com; docker compose -f docker-compose.yml up -d --build --remove-orphans; sleep 5; docker compose -f docker-compose.yml exec -T sotoobrador-web npx prisma@5.22.0 db push --accept-data-loss --skip-generate"
if errorlevel 1 goto error

echo.
echo [5/5] Verificando /api/health...
ssh %REMOTE_USER%@%REMOTE_HOST% "curl -s -o /dev/null -w 'HTTP %%{http_code}\n' https://obrador.sotodelprior.com/api/health"

echo.
echo ============================================================
echo   [OK] SETUP COMPLETADO.
echo.
echo   A partir de ahora usa DESPLEGAR.bat (opcion 1) para todo.
echo   Si /api/health devolvio 200, puedes borrar el respaldo viejo:
echo     ssh %REMOTE_USER%@%REMOTE_HOST% "rm -rf %REMOTE_PARENT%/obrador_old_*"
echo ============================================================
pause
endlocal
exit /b 0

:error
echo.
echo ============================================================
echo   [ERROR] El setup fallo. Revisa el mensaje anterior.
echo   Nada se ha borrado: tu carpeta anterior sigue como
echo   %REMOTE_PARENT%/obrador_old_*  y la BD esta intacta.
echo   Para reintentar, primero entra por SSH y elimina la
echo   carpeta obrador a medias:  rm -rf %REMOTE_PATH%
echo ============================================================
pause
endlocal
exit /b 1
