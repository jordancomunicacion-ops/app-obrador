import { prisma } from "@/app/lib/prisma";

export type DateRange = {
  from: Date;
  to: Date;
};

export function parseDateRange(searchParams: URLSearchParams | Record<string, string | undefined>): DateRange {
  const get = (k: string) =>
    searchParams instanceof URLSearchParams ? searchParams.get(k) : searchParams[k];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const monthAgo = new Date(today);
  monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);

  const fromStr = get("from");
  const toStr = get("to");

  const from = fromStr ? new Date(`${fromStr}T00:00:00.000Z`) : monthAgo;
  const to = toStr ? new Date(`${toStr}T23:59:59.999Z`) : new Date();
  return { from, to };
}

export type OperationsKPIs = {
  programados: number;
  lineasSupervisadas: number;     // % of responses supervised
  checklistsRealizados: number;   // % of instances DONE or INCIDENT
  supervisadosTotalmente: number; // % of DONE/INCIDENT instances with ALL responses supervised
  valoracionMedia: number;        // 0-100 from RATING_1_10 fields
  lineasRealizadas: number;       // % of expected responses actually answered
};

export async function computeOperationsKPIs(
  orgId: string,
  range: DateRange,
  locationId?: string,
): Promise<OperationsKPIs> {
  const baseWhere = {
    schedule: {
      businessId: orgId,
      ...(locationId ? { locationId } : {}),
    },
    dueDate: { gte: range.from, lte: range.to },
  };

  const [instances, responseAgg] = await Promise.all([
    prisma.checklistInstance.findMany({
      where: baseWhere,
      select: {
        id: true,
        status: true,
        scoreAvg: true,
        schedule: { select: { template: { select: { _count: { select: { fields: true } } } } } },
        responses: {
          select: {
            id: true,
            supervisedAt: true,
            field: { select: { type: true } },
          },
        },
      },
    }),
    prisma.checklistResponse.aggregate({
      where: {
        instance: baseWhere,
        valueRating: { not: null },
      },
      _avg: { valueRating: true },
    }),
  ]);

  const programados = instances.length;

  // "Líneas Supervisadas" — % of answered (non-TITLE) responses with supervisedAt
  let totalAnswerable = 0;
  let totalSupervised = 0;
  for (const i of instances) {
    for (const r of i.responses) {
      if (r.field.type !== "TITLE") {
        totalAnswerable++;
        if (r.supervisedAt) totalSupervised++;
      }
    }
  }
  const lineasSupervisadas =
    totalAnswerable === 0 ? 0 : (totalSupervised / totalAnswerable) * 100;

  // "Checklists Realizados" — % of instances con status DONE/INCIDENT
  const realizados = instances.filter(
    (i) => i.status === "DONE" || i.status === "INCIDENT",
  ).length;
  const checklistsRealizados = programados === 0 ? 0 : (realizados / programados) * 100;

  // "Supervisados Totalmente" — % of cerradas con TODAS respuestas supervisadas
  const completados = instances.filter(
    (i) => i.status === "DONE" || i.status === "INCIDENT",
  );
  const supervisadosTot = completados.filter((i) => {
    const answer = i.responses.filter((r) => r.field.type !== "TITLE");
    if (answer.length === 0) return false;
    return answer.every((r) => r.supervisedAt !== null);
  }).length;
  const supervisadosTotalmente =
    completados.length === 0 ? 0 : (supervisadosTot / completados.length) * 100;

  // "Valoración Media" — escala 1-10 → %
  const avg = responseAgg._avg.valueRating ?? 0;
  const valoracionMedia = (avg / 10) * 100;

  // "Líneas Realizadas" — % de respuestas esperadas que fueron contestadas
  // Expected = sum over instances of (fields count - title fields). Aprox sin restar TITLES exactos.
  let totalExpected = 0;
  let totalActual = 0;
  for (const i of instances) {
    const fieldsCount = i.schedule.template._count.fields;
    totalExpected += fieldsCount;
    totalActual += i.responses.length;
  }
  const lineasRealizadas =
    totalExpected === 0 ? 0 : Math.min(100, (totalActual / totalExpected) * 100);

  return {
    programados,
    lineasSupervisadas,
    checklistsRealizados,
    supervisadosTotalmente,
    valoracionMedia,
    lineasRealizadas,
  };
}

// ---------------------------------------------------------------------------
// Frente B (Opción B): KPIs de la familia PRODUCCIÓN (modelo `Task`), para el
// reporting unificado. Sin migración: lee los modelos existentes.
// ---------------------------------------------------------------------------

export type ProductionKPIs = {
  tareas: number; // Task con hora planificada en el rango
  realizadas: number; // % DONE
  enCurso: number; // % IN_PROGRESS
  incidencias: number; // nº ISSUE
};

export async function computeProductionKPIs(
  orgId: string,
  range: DateRange,
  locationId?: string,
): Promise<ProductionKPIs> {
  const tasks = await prisma.task.findMany({
    where: {
      businessId: orgId,
      ...(locationId ? { locationId } : {}),
      plannedStart: { gte: range.from, lte: range.to },
    },
    select: { status: true },
  });

  const total = tasks.length;
  const norm = (s: string | null) => (s ?? "").toUpperCase();
  const done = tasks.filter((t) => norm(t.status) === "DONE").length;
  const inProgress = tasks.filter((t) => norm(t.status) === "IN_PROGRESS").length;
  const issues = tasks.filter((t) => norm(t.status) === "ISSUE").length;

  return {
    tareas: total,
    realizadas: total === 0 ? 0 : (done / total) * 100,
    enCurso: total === 0 ? 0 : (inProgress / total) * 100,
    incidencias: issues,
  };
}
