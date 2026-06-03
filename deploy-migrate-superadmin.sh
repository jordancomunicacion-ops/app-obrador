#!/usr/bin/env bash
#
# Migración one-off en PRODUCCIÓN (VPS): separa plataforma (gerencia → SUPERADMIN)
# del tenant de negocio, reasignando todos los datos. Reutiliza el script TS ya
# validado (apps/web/scripts/migrate-gerencia-to-superadmin.ts).
#
# Por qué un contenedor de usar y tirar: la imagen `sotoobrador-web` es un build
# standalone de Next y NO incluye ts-node ni la carpeta scripts/. Levantamos un
# node:20 efímero, montamos apps/web y lo conectamos a la red interna de la BD.
#
# USO (en el VPS, desde la carpeta del repo donde está docker-compose.yml):
#   ./deploy-migrate-superadmin.sh
#
# Variables opcionales (con valores por defecto en el script TS):
#   TENANT_EMAIL=obrador@sotodelprior.com  TENANT_PASSWORD=...  TENANT_NAME="..."
#   PLATFORM_EMAIL=gerencia@sotodelprior.com
#
# Idempotente: re-ejecutarlo no duplica datos (reasigna 0 filas si ya está migrado).

set -euo pipefail

# --- Localizar raíz del repo (donde vive docker-compose.yml) ---
cd "$(dirname "$0")"
if [[ ! -f docker-compose.yml ]]; then
  echo "ERROR: no encuentro docker-compose.yml junto a este script." >&2
  exit 1
fi

# --- Credenciales de BD: de .env si existe, con los mismos defaults del compose ---
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi
DB_USER="${DB_USER:-cocina_user}"
DB_PASS="${DB_PASS:-cocina_pass}"
DB_NAME="${DB_NAME:-obrador}"

# Nombre de la red interna que crea compose (proyecto "sotoobrador" + red).
NET="sotoobrador_obrador-internal-net"
if ! docker network inspect "$NET" >/dev/null 2>&1; then
  echo "ERROR: no existe la red docker '$NET'. ¿Está levantado el stack (docker compose up)?" >&2
  echo "Redes disponibles:" >&2
  docker network ls --format '  {{.Name}}' >&2
  exit 1
fi

# Hostname de la BD dentro de la red = nombre del servicio.
DB_HOST="sotoobrador-db"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:5432/${DB_NAME}"

echo "==> Migración SUPERADMIN contra ${DB_HOST}:5432/${DB_NAME} (red ${NET})"
echo "==> Tenant: ${TENANT_EMAIL:-obrador@sotodelprior.com} / ${TENANT_NAME:-Soto del Prior (Obrador)}"

docker run --rm \
  --network "$NET" \
  -v "$(pwd)/apps/web:/app" \
  -w /app \
  -e DATABASE_URL="$DATABASE_URL" \
  -e PLATFORM_EMAIL="${PLATFORM_EMAIL:-gerencia@sotodelprior.com}" \
  -e TENANT_EMAIL="${TENANT_EMAIL:-obrador@sotodelprior.com}" \
  -e TENANT_PASSWORD="${TENANT_PASSWORD:-Obrador2026!}" \
  -e TENANT_NAME="${TENANT_NAME:-Soto del Prior (Obrador)}" \
  node:20-bullseye-slim \
  sh -c '
    set -e
    echo "--> Instalando dependencias (one-off)..."
    npm install --no-audit --no-fund --silent
    echo "--> Generando Prisma Client..."
    npx prisma generate >/dev/null
    echo "--> Ejecutando migración..."
    npx ts-node scripts/migrate-gerencia-to-superadmin.ts
  '

echo "==> Hecho. Verifica entrando como gerencia (SUPERADMIN) y eligiendo el tenant en el selector."
