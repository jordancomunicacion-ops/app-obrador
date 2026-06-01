"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { scheduleAppliesOn, startOfDayUTC } from "@/app/lib/recurrence";
import type { Frequency } from "@prisma/client";

export type ProductionRoutineInput = {
  title: string;
  description?: string | null;
  recipeId?: string | null;
  action?: string | null;
  technique?: string | null;
  targetQuantity?: number | null;
  unit?: string | null;
  frequency: Frequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  excludeWeekdays?: number[];
  executionTime?: string | null; // "HH:MM"
  defaultAssigneeUserId?: string | null;
  locationId?: string | null;
  isActive?: boolean;
};

function toData(input: ProductionRoutineInput) {
  if (!input.title?.trim()) throw new Error("El título es obligatorio");
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    recipeId: input.recipeId || null,
    action: input.action?.trim() || null,
    technique: input.technique?.trim() || null,
    targetQuantity: input.targetQuantity ?? null,
    unit: input.unit?.trim() || null,
    frequency: input.frequency,
    startDate: new Date(`${input.startDate}T00:00:00.000Z`),
    endDate: input.endDate ? new Date(`${input.endDate}T00:00:00.000Z`) : null,
    excludeWeekdays: input.excludeWeekdays ?? [],
    executionTime: input.executionTime?.trim() || null,
    defaultAssigneeUserId: input.defaultAssigneeUserId || null,
    locationId: input.locationId || null,
    isActive: input.isActive ?? true,
  };
}

export async function createProductionRoutine(input: ProductionRoutineInput) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const created = await prisma.productionRoutine.create({
    data: { ...toData(input), ownerId: orgId },
  });
  revalidatePath("/dashboard/tasks/routines");
  return created;
}

export async function updateProductionRoutine(id: string, input: ProductionRoutineInput) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const existing = await prisma.productionRoutine.findFirst({
    where: { id, ownerId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Ciclo no encontrado");
  await prisma.productionRoutine.update({ where: { id }, data: toData(input) });
  revalidatePath("/dashboard/tasks/routines");
}

export async function deleteProductionRoutine(id: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const existing = await prisma.productionRoutine.findFirst({
    where: { id, ownerId: orgId },
    select: { id: true },
  });
  if (!existing) throw new Error("Ciclo no encontrado");
  // Las Task generadas quedan (productionRoutineId → SetNull); solo se borra el ciclo.
  await prisma.productionRoutine.delete({ where: { id } });
  revalidatePath("/dashboard/tasks/routines");
}

/**
 * Genera las Task de producción de los ciclos que aplican en la fecha dada.
 * Idempotente: cada tarea usa un id determinístico `routine_<id>_<YYYYMMDD>`, así
 * que reejecutar el cron no duplica (violación de PK → skipped). Si no se pasa
 * orgId, genera para todos los clientes (uso desde cron).
 */
export async function generateProductionTasksForDate(
  date: Date = new Date(),
  scopedOrgId?: string,
) {
  const day = startOfDayUTC(date);
  const ymd = day.toISOString().slice(0, 10).replace(/-/g, "");

  const routines = await prisma.productionRoutine.findMany({
    where: { isActive: true, ...(scopedOrgId ? { ownerId: scopedOrgId } : {}) },
    select: {
      id: true,
      title: true,
      recipeId: true,
      action: true,
      technique: true,
      targetQuantity: true,
      unit: true,
      frequency: true,
      startDate: true,
      endDate: true,
      excludeWeekdays: true,
      executionTime: true,
      defaultAssigneeUserId: true,
      ownerId: true,
      locationId: true,
    },
  });

  const applicable = routines.filter((r) => scheduleAppliesOn(r, day));
  if (applicable.length === 0) return { created: 0, skipped: 0 };

  let created = 0;
  let skipped = 0;
  for (const r of applicable) {
    // Hora planificada = fecha + executionTime ("HH:MM"); si no hay, inicio del día.
    let plannedStart: Date = new Date(day);
    if (r.executionTime && /^\d{1,2}:\d{2}$/.test(r.executionTime)) {
      const [h, m] = r.executionTime.split(":").map(Number);
      plannedStart = new Date(day);
      plannedStart.setUTCHours(h, m, 0, 0);
    }
    try {
      await prisma.task.create({
        data: {
          id: `routine_${r.id}_${ymd}`,
          title: r.title,
          status: "PENDING",
          recipeId: r.recipeId,
          action: r.action,
          technique: r.technique,
          targetQuantity: r.targetQuantity,
          unit: r.unit,
          plannedStart,
          assignedToUserId: r.defaultAssigneeUserId,
          ownerId: r.ownerId,
          locationId: r.locationId,
          productionRoutineId: r.id,
        },
      });
      created++;
    } catch {
      skipped++; // Ya existía (id determinístico ya creado para ese día)
    }
  }
  return { created, skipped };
}
