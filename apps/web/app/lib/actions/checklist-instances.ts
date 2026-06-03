"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { sendPushToUser, sendPushToUsers } from "@/app/lib/push/send";
import { scheduleAppliesOn, startOfDayUTC } from "@/app/lib/recurrence";

// ============================================================================
// Generación de instancias del día
// ============================================================================

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
    where: scopedOrgId ? { businessId: scopedOrgId } : {},
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
    where: { id: instanceId, schedule: { businessId: orgId } },
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
  const isAssignee = instance.assignedToUserId === session.user.id;
  const isPerformer =
    instance.schedule.performerUserIds.includes(session.user.id) ||
    instance.schedule.performerRoles.includes((session.user as any).role ?? "");
  const isSupervisor =
    instance.schedule.supervisorUserIds.includes(session.user.id) ||
    instance.schedule.supervisorRoles.includes((session.user as any).role ?? "");

  if (!isOwner && !isAssignee && !isPerformer && !isSupervisor) {
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

// ============================================================================
// Asignación de instancias a una persona concreta
// ============================================================================

/**
 * Asigna (o desasigna, con assigneeUserId = null) una instancia a un usuario.
 * Solo el propietario/admin o un supervisor de la programación pueden asignar.
 * Si se asigna, se envía un push al asignado.
 */
export async function assignChecklistInstance(
  instanceId: string,
  assigneeUserId: string | null,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const instance = await prisma.checklistInstance.findFirst({
    where: { id: instanceId, schedule: { businessId: orgId } },
    include: {
      schedule: {
        select: {
          supervisorUserIds: true,
          supervisorRoles: true,
          template: { select: { name: true } },
          location: { select: { name: true } },
        },
      },
    },
  });
  if (!instance) throw new Error("Instance not found");

  const role = (session.user as any).role ?? "";
  const isOwner = session.user.id === orgId;
  const isSupervisor =
    instance.schedule.supervisorUserIds.includes(session.user.id) ||
    instance.schedule.supervisorRoles.includes(role);
  if (!isOwner && !isSupervisor) throw new Error("Forbidden");

  // Validar que el asignado pertenece a la organización.
  if (assigneeUserId) {
    const user = await prisma.user.findFirst({
      where: { id: assigneeUserId, OR: [{ id: orgId }, { adminId: orgId }] },
      select: { id: true },
    });
    if (!user) throw new Error("Usuario no válido");
  }

  await prisma.checklistInstance.update({
    where: { id: instanceId },
    data: { assignedToUserId: assigneeUserId },
  });

  if (assigneeUserId && assigneeUserId !== session.user.id) {
    await sendPushToUser(assigneeUserId, {
      title: `📋 Tarea asignada: ${instance.schedule.template.name}`,
      body: instance.schedule.location.name,
      url: `/dashboard/today/checklist/${instanceId}`,
      tag: `assign-${instanceId}`,
    });
  }

  revalidatePath("/dashboard/tasks/assign");
  revalidatePath("/dashboard/today");
}
