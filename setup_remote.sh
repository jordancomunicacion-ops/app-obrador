#!/bin/bash
set -e

echo "=== ACTUALIZANDO APP COCINA (AUTONOMA) ==="

echo "-> DETENIENDO CONTENEDORES ANTIGUOS..."
docker stop sotococina-web sotococina-db || true
docker rm sotococina-web sotococina-db || true

echo "-> Limpiando absolutamente todo lo anterior para liberar espacio..."
docker rmi cocina-web:latest || true
docker system prune -af || true

echo "-> Asegurando red..."
docker network create cocina-internal-net || true

echo "-> Desplegando..."
# Ya estamos en la carpeta correcta
export AUTH_URL="https://cocina.sotodelprior.com"
docker compose -f docker-compose.yml up -d --build --remove-orphans

echo "-> ASEGURANDO ESTADO LLAVE DE MIGRACIONES..."
# Marcar la migración inicial como aplicada si la base de datos ya existe (Baselining)
docker compose -f docker-compose.yml exec -T sotococina-web npx prisma@5.22.0 migrate resolve --applied 20260127225950_init || true

echo "-> FORZANDO SINCRONIZACION DE ESQUEMA (DB PUSH)..."
docker compose -f docker-compose.yml exec -T sotococina-web npx prisma@5.22.0 db push --accept-data-loss --skip-generate

echo "=== COCINA ACTUALIZADA ==="
