-- Clave de la API de integración (lectura) POR CUENTA (User ADMIN).
-- Sustituye a la variable de entorno única INTEGRATION_API_KEY: ahora cada
-- cuenta de obrador genera/rota su clave desde Ajustes y la API la resuelve
-- contra esta tabla para devolver sólo los datos de esa cuenta.

CREATE TABLE "IntegrationApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationApiKey_key_key" ON "IntegrationApiKey"("key");
CREATE INDEX "IntegrationApiKey_ownerId_idx" ON "IntegrationApiKey"("ownerId");

ALTER TABLE "IntegrationApiKey"
  ADD CONSTRAINT "IntegrationApiKey_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
