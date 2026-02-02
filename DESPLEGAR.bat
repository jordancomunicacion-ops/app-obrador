@echo off
echo ==========================================
echo   DESPLIEGUE AUTONOMO COCINA - SOTO DEL PRIOR
echo ==========================================
echo.

echo [1/3] Empaquetando App Cocina...
:: Como ya estamos dentro de la carpeta de la app, empaquetamos todo (".")
:: Excluimos node_modules locales para velocidad, .git, etc.
tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude=".idea" --exclude=".vscode" --exclude="dist" --exclude="build" --exclude="*.log" --exclude="docker-compose.override.yml" --exclude="deploy.tar.gz" -czvf deploy.tar.gz .

echo.
echo [2/3] Subiendo al servidor...
:: Subimos a una carpeta especifica para esta app
scp deploy.tar.gz root@164.92.167.42:/root/deploy_cocina.tar.gz

echo.
echo [3/3] Limpiando despliegue anterior e instalando...
:: Borramos archivos antiguos (excepto db_data para preservar la base de datos), luego descomprimimos
ssh root@164.92.167.42 "mkdir -p SOTOdelPRIOR/apps/cocina && cd SOTOdelPRIOR/apps/cocina && find . -mindepth 1 -maxdepth 1 ! -name 'db_data' ! -name 'cocina_db_data' -exec rm -rf {} + && tar -xzvf /root/deploy_cocina.tar.gz > /dev/null && mv .env.production .env && sed -i 's/\r$//' setup_remote.sh && bash setup_remote.sh"

echo.
echo Limpiando...
del deploy.tar.gz

echo.
echo ==========================================
echo        COCINA ACTUALIZADA (MODO APP)
echo ==========================================
pause
