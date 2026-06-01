import { NextRequest, NextResponse } from "next/server";
import { generateInstancesForDate } from "@/app/lib/actions/checklist-instances";
import { generateProductionTasksForDate } from "@/app/lib/actions/production-routines";

/**
 * Generación automática (cron) de las instancias de checklist del ciclo, para
 * TODOS los clientes. Idempotente (el @@unique([scheduleId, dueDate]) evita duplicar).
 *
 * No usa sesión: se protege con un secreto (CRON_SECRET) por header `x-cron-secret`
 * o query `?secret=`. Pensado para un cron del VPS, p. ej.:
 *   5 0 * * * curl -fsS -H "x-cron-secret: <SECRET>" https://cocina.sotodelprior.com/api/cron/generate-tasks
 *
 * Genera hoy y mañana (para poder asignar la víspera). La generación lazy al abrir
 * "Hoy" se mantiene como respaldo.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 503 },
    );
  }

  const provided =
    req.headers.get("x-cron-secret") ??
    req.nextUrl.searchParams.get("secret") ??
    "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [t, tm, pt, ptm] = await Promise.all([
    generateInstancesForDate(today),
    generateInstancesForDate(tomorrow),
    generateProductionTasksForDate(today),
    generateProductionTasksForDate(tomorrow),
  ]);

  return NextResponse.json({
    ok: true,
    checklists: {
      today: t,
      tomorrow: tm,
      created: t.created + tm.created,
      skipped: t.skipped + tm.skipped,
    },
    production: {
      today: pt,
      tomorrow: ptm,
      created: pt.created + ptm.created,
      skipped: pt.skipped + ptm.skipped,
    },
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
