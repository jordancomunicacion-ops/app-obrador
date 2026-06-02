import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveIntegrationAuth } from "@/app/lib/integration-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MS_DAY = 24 * 60 * 60 * 1000;

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s.length <= 10 ? `${s}T00:00:00` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffMin(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

/**
 * GET /api/integrations/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Tareas ejecutadas en el período (las que tienen `realStart` dentro del rango),
 * con tiempos reales y planificados por empleado. Es la materia prima con la que
 * el CRM calcula la eficiencia y el desempeño: cuánto se tardó frente a lo
 * planificado, retrasos y tareas con incidencia.
 *
 * Auth: cabecera `x-api-key` (INTEGRATION_API_KEY).
 */
export async function GET(req: NextRequest) {
  const auth = await resolveIntegrationAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sp = req.nextUrl.searchParams;
  const from = parseDate(sp.get("from"));
  const to = parseDate(sp.get("to"));
  if (!from || !to || to < from) {
    return NextResponse.json(
      { error: "Parámetros 'from' y 'to' (YYYY-MM-DD) obligatorios y coherentes" },
      { status: 400 }
    );
  }
  const periodEnd = new Date(to.getTime() + MS_DAY - 1);

  const tasks = await prisma.task.findMany({
    where: { ownerId: auth.ownerId, realStart: { gte: from, lte: periodEnd } },
    orderBy: { realStart: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      issueReason: true,
      action: true,
      technique: true,
      plannedStart: true,
      plannedEnd: true,
      realStart: true,
      realEnd: true,
      targetQuantity: true,
      unit: true,
      assignedToUserId: true,
      assignedTo: { select: { id: true, dni: true, name: true } },
      recipe: { select: { id: true, name: true } },
      locationId: true,
    },
  });

  return NextResponse.json({
    period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
    count: tasks.length,
    tasks: tasks.map((t) => {
      const realMin = diffMin(t.realStart, t.realEnd);
      const plannedMin = diffMin(t.plannedStart, t.plannedEnd);
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        issueReason: t.issueReason,
        action: t.action,
        technique: t.technique,
        recipeId: t.recipe?.id ?? null,
        recipeName: t.recipe?.name ?? null,
        targetQuantity: t.targetQuantity,
        unit: t.unit,
        employeeUserId: t.assignedToUserId,
        employeeDni: t.assignedTo?.dni ?? null,
        employeeName: t.assignedTo?.name ?? null,
        plannedStart: t.plannedStart?.toISOString() ?? null,
        plannedEnd: t.plannedEnd?.toISOString() ?? null,
        realStart: t.realStart?.toISOString() ?? null,
        realEnd: t.realEnd?.toISOString() ?? null,
        realDurationMin: realMin,
        plannedDurationMin: plannedMin,
        // Retraso de ejecución: minutos reales por encima de lo planificado (si ambos existen).
        overrunMin: realMin != null && plannedMin != null ? realMin - plannedMin : null,
        locationId: t.locationId,
      };
    }),
  });
}
