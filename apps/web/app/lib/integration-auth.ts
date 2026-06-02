import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

/**
 * Autenticación de la API de integración (lectura) que consume el CRM. Cada
 * cuenta de obrador (User ADMIN) genera su propia clave desde Ajustes →
 * "API key integración (CRM)" y la pega en el CRM. Cuando llega una petición a
 * `/api/integrations/*`, resolvemos a qué cuenta pertenece la clave y devolvemos
 * su `ownerId`: los endpoints lo usan para filtrar y devolver sólo los datos de
 * esa cuenta (operarios, tareas).
 *
 * La cabecera admite `x-api-key: <clave>` o `Authorization: Bearer <clave>`.
 */
export type IntegrationAuth =
  | { ok: true; ownerId: string }
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
    select: { ownerId: true },
  });
  if (!row) {
    return { ok: false, status: 401, error: "API key no válida" };
  }
  return { ok: true, ownerId: row.ownerId };
}
