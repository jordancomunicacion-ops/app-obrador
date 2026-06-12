import { NextRequest, NextResponse } from "next/server";
import { syncPlantillaFromContabilidad } from "@/app/lib/contabilidad-sync";
import { contabilidadConfigured } from "@/app/lib/contabilidad";

/**
 * Sincronización automática (cron) de la plantilla desde el ERP de
 * contabilidad: da de alta a los empleados que falten y actualiza
 * contrato/jornada de los existentes (cruce por DNI). Idempotente.
 *
 * No usa sesión: se protege con CRON_SECRET por header `x-cron-secret`
 * o query `?secret=`, igual que /api/cron/generate-tasks. Cron del VPS:
 *   15 0 * * * curl -fsS -H "x-cron-secret: <SECRET>" https://obrador.sotodelprior.com/api/cron/sync-contabilidad
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }

  const provided =
    req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret") ?? "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!contabilidadConfigured()) {
    return NextResponse.json(
      { error: "Integración con contabilidad no configurada (CONTABILIDAD_API_URL / CONTABILIDAD_API_KEY)" },
      { status: 503 },
    );
  }

  try {
    const result = await syncPlantillaFromContabilidad();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Cron sync-contabilidad error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error sincronizando con contabilidad" },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
