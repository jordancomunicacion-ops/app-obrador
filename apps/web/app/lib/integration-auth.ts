import { NextRequest } from "next/server";

/**
 * Autenticación de la API de integración (lectura) que consume el CRM para tirar
 * de la plantilla y de los tiempos de tareas.
 *
 * Igual que los crons del obrador, no usa sesión: se protege con un secreto
 * compartido `INTEGRATION_API_KEY` enviado en la cabecera `x-api-key` (o
 * `Authorization: Bearer <clave>`). Pensado para que lo llame el CRM, p. ej.:
 *   GET https://obrador.sotodelprior.com/api/integrations/tasks?from=...&to=...
 */
export function checkIntegrationKey(req: NextRequest): { ok: boolean; status: number; error?: string } {
  const secret = process.env.INTEGRATION_API_KEY;
  if (!secret) {
    return { ok: false, status: 503, error: "INTEGRATION_API_KEY no configurado" };
  }
  const provided =
    req.headers.get("x-api-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (provided !== secret) {
    return { ok: false, status: 401, error: "API key no válida" };
  }
  return { ok: true, status: 200 };
}
