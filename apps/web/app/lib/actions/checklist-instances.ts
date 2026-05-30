"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { sendPushToUsers } from "@/lib/push/send";
import type { Frequency } from "@prisma/client";

// ============================================================================
// Generación de instancias del día
// ============================================================================

function startOfDayUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Devuelve true si la programación debe generar una instancia para la fecha dada
 * según su frecuencia, fecha de inicio, fecha de fin y días excluidos.
 */
function scheduleAppliesOn(
  schedule: {
    frequency: Frequency;
    startDate: Date;
    endDate: Date | null;
    excludeWeekdays: number[];
  },
  date: Date,
): boolean {
  const day = startOfDayUTC(date);
  const start = startOfDayUTC(schedule.startDate);
  if (day < start) return false;
  if (schedule.endDate && day > startOfDayUTC(schedule.endDate)) return false;

  // 0=domingo … 6=sábado (UTC)
  const weekday = day.getUTCDay();
  if (schedule.excludeWeekdays.includes(weekday)) return false;

  const msInDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor((day.getTime() - start.getTime()) / msInDay);

  switch (schedule.frequency) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return daysSinceStart % 7 === 0;
    case "BIWEEKLY":
      return daysSinceStart % 14 === 0;
    case "MONTHLY":
      return day.getUTCDate() === start.getUTCDate();
    case "QUARTERLY":
      return (
        day.getUTCDate() === start.getUTCDate() &&
        (day.getUTCMonth() - start.getUTCMonth() + 12) % 3 === 0
      );
    case "SEMIANNUAL":
      return (
        day.getUTCDate() === start.getUTCDate() &&
        (day.getUTCMonth() - start.getUTCMonth() + 12) % 6 === 0
      );
    case "ANNUAL":
      return (
        day.getUTCDate() === start.getUTCDate() && day.getUTCMonth() === start.getUTCMonth()
      );
    default:
      return false;
  }
}

/**
 * Crea ChecklistInstance para la fecha dada para todas las programaciones del cliente
 * que aplican. Idempotente: el @@unique([scheduleId, dueDate]) garantiza no duplicar.
 * Si no se pasa orgId se hace para todos los clientes (uso desde cron).
 */
export async function generateInstancesForDate(
  date: Date = new Date(),
  scopedOrgId?: string,
) {
  const dueDate = startOfDayUTC(date);
  const schedules = await prisma.checklistSchedule.findMany({
    where: scopedOrgId ? { ownerId: scopedOrgId } : {},
    select: {
      id: true,
      frequency: true,
      startDate: true,
      endDate: true,
      excludeWeekdays: true,
    },
  });

  const applicable = schedules.filter((s) => scheduleAppliesOn(s, dueDate));

  if (applicable.length === 0) return { created: 0, skipped: 0 };

  let created = 0;
  let skipped = 0;
  for (const s of applicable) {
    try {
      await prisma.checklistInstance.create({
        data: { scheduleId: s.id, dueDate },
      });
      created++;
    } catch {
      skipped++; // Ya existía (unique violation)
    }
  }
  return { created, skipped };
}

// ============================================================================
// Apertura / cierre / respuestas
// ============================================================================

async function loadInstanceForUser(instanceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const instance = await prisma.checklistInstance.findFirst({
    where: { id: instanceId, schedule: { ownerId: orgId } },
    include: {
      schedule: {
        select: {
          performerUserIds: true,
          performerRoles: true,
          supervisorUserIds: true,
          supervisorRoles: true,
        },
      },
    },
  });
  if (!instance) throw new Error("Instance not found");

  // Verificar que el usuario puede actuar sobre esta instancia.
  const isOwner = session.user.id === orgId;
  const isPerformer =
    instance.schedule.performerUserIds.includes(session.user.id) ||
    instance.schedule.performerRoles.includes((session.user as any).role ?? "");
  const isSupervisor =
    instance.schedule.supervisorUserIds.includes(session.user.id) ||
    instance.schedule.supervisorRoles.includes((session.user as any).role ?? "");

  if (!isOwner && !isPerformer && !isSupervisor) {
    throw new Error("Forbidden");
  }

  return { instance, userId: session.user.id };
}

export async function openInstance(instanceId: string) {
  const { instance } = await loadInstanceForUser(instanceId);
  if (instance.status === "PENDING") {
    await prisma.checklistInstance.update({
      where: { id: instance.id },
      data: { status: "IN_PROGRESS", openedAt: new Date() },
    });
    revalidatePath(`/dashboard/today/checklist/${instance.id}`);
  }
}

export async function saveResponse(
  instanceId: string,
  fieldId: string,
  data: {
    valueText?: string | null;
    valueBool?: boolean | null;
    valueRating?: number | null;
    photoUrl?: string | null;
    photoKey?: string | null;
    isIncident?: boolean;
    incidentNote?: string | null;
  },
) {
  const { instance, userId } = await loadInstanceForUser(instanceId);

  const field = await prisma.checklistField.findFirst({
    where: {
      id: fieldId,
      template: { schedules: { some: { id: instance.scheduleId } } },
    },
    select: { id: true },
  });
  if (!field) throw new Error("Field not in this template");

  await prisma.checklistResponse.upsert({
    where: { instanceId_fieldId: { instanceId, fieldId } },
    create: {
      instanceId,
      fieldId,
      valueText: data.valueText ?? null,
      valueBool: data.valueBool ?? null,
      valueRating: data.valueRating ?? null,
      photoUrl: data.photoUrl ?? null,
      photoKey: data.photoKey ?? null,
      isIncident: data.isIncident ?? false,
      incidentNote: data.incidentNote ?? null,
      answeredByUserId: userId,
      answeredAt: new Date(),
    },
    update: {
      valueText: data.valueText ?? null,
      valueBool: data.valueBool ?? null,
      valueRating: data.valueRating ?? null,
      photoUrl: data.photoUrl ?? null,
      photoKey: data.photoKey ?? null,
      isIncident: data.isIncident ?? false,
      incidentNote: data.incidentNote ?? null,
      answeredByUserId: userId,
      answeredAt: new Date(),
    },
  });

  if (instance.status === "PENDING") {
    await prisma.checklistInstance.update({
      where: { id: instance.id },
      data: { status: "IN_PROGRESS", openedAt: new Date() },
    });
  }

  revalidatePath(`/dashboard/today/checklist/${instance.id}`);
}

export async function closeInstance(instanceId: string) {
  const { instance, userId } = await loadInstanceForUser(instanceId);

  // Calcular valoración media a partir de campos RATING_1_10
  const ratings = await prisma.checklistResponse.findMany({
    where: { instanceId, valueRating: { not: null } },
    select: { valueRating: true },
  });
  const scoreAvg =
    ratings.length === 0
      ? null
      : ratings.reduce((sum, r) => sum + (r.valueRating ?? 0), 0) / ratings.length;

  const incidents = await prisma.checklistResponse.count({
    where: { instanceId, isIncident: true },
  });

  await prisma.checklistInstance.update({
    where: { id: instance.id },
    data: {
      status: incidents > 0 ? "INCIDENT" : "DONE",
      closedAt: new Date(),
      closedByUserId: userId,
      scoreAvg,
    },
  });

  // Push a supervisores
  const full = await prisma.checklistInstance.findUnique({
    where: { id: instance.id },
    include: {
      schedule: {
        select: {
          supervisorUserIds: true,
          template: { select: { name: true } },
          location: { select: { name: true } },
        },
      },
    },
  });
  if (full?.schedule.supervisorUserIds.length) {
    await sendPushToUsers(
      full.schedule.supervisorUserIds.filter((id) => id !== userId),
      {
        title:
          (incidents > 0 ? "⚠️ Con incidencias: " : "✅ Completado: ") +
          full.schedule.template.name,
        body:
          full.schedule.location.name +
          (incidents > 0 ? ` · ${incidents} ${incidents === 1 ? "incidencia" : "incidencias"}` : ""),
        url: `/dashboard/tasks/supervise/${instance.id}`,
        tag: `instance-${instance.id}`,
      },
    );
  }

  revalidatePath(`/dashboard/today/checklist/${instance.id}`);
  revalidatePath("/dashboard/today");
}
