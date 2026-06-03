import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

/**
 * Autenticación de la API de integración (lectura) que consume el CRM. Cada
 * **local** (Location) genera su propia clave desde Ajustes → "Integración CRM"
 * y la pega en el CRM. Cuando llega una petición a `/api/integrations/*`,
 * resolvemos a qué local pertenece la clave y devolvemos sólo los datos de ese
 * local (operarios asignados, tareas ocurridas allí). De este modo el CRM
 * no ve datos cruzados con otros locales del mismo negocio.
 *
 * La cabecera admite `x-api-key: <clave>` o `Authorization: Bearer <clave>`.
 */
export type IntegrationAuth =
  | { ok: true; locationId: string; businessId: string | null }
  | { ok: false; status: number; error: string };

function extractKey(req: NextRequest): string {
  return (
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  ).trim();
}

export async function resolveIntegrationAuth(req: NextRequest): Promise<IntegrationAuth> {
  const provided = extractKey(req);
  if (!provided || provided.length < 8) {
    return { ok: false, status: 401, error: "API key requerida" };
  }
  const row = await prisma.integrationApiKey.findUnique({
    where: { key: provided },
    select: {
      locationId: true,
      location: { select: { businessId: true, isActive: true } },
    },
  });
  if (!row || !row.location?.isActive) {
    return { ok: false, status: 401, error: "API key no válida" };
  }
  return { ok: true, locationId: row.locationId, businessId: row.location.businessId };
}
