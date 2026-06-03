"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import type { Frequency } from "@prisma/client";

type ScheduleInput = {
  templateId: string;
  locationId: string;
  frequency: Frequency;
  startDate: string;       // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  executionStartTime: string; // HH:MM
  executionEndTime: string;   // HH:MM
  excludeWeekdays: number[];
  autoClose: boolean;
  pinned: boolean;
  performerUserIds: string[];
  supervisorUserIds: string[];
  followerUserIds: string[];
  performerRoles: string[];
  supervisorRoles: string[];
  followerRoles: string[];
};

async function assertOwnerOfSchedule(id: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const s = await prisma.checklistSchedule.findFirst({
    where: { id, businessId: orgId },
    select: { id: true },
  });
  if (!s) throw new Error("Schedule not found");
  return orgId;
}

function parseDate(s: string) {
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date ${s}`);
  return d;
}

async function validateOrgScope(orgId: string, templateId: string, locationId: string) {
  const [tpl, loc] = await Promise.all([
    prisma.checklistTemplate.findFirst({ where: { id: templateId, businessId: orgId } }),
    prisma.location.findFirst({ where: { id: locationId, businessId: orgId } }),
  ]);
  if (!tpl) throw new Error("Template not found");
  if (!loc) throw new Error("Location not found");
}

export async function createSchedule(data: ScheduleInput) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  await validateOrgScope(orgId, data.templateId, data.locationId);

  await prisma.checklistSchedule.create({
    data: {
      templateId: data.templateId,
      locationId: data.locationId,
      frequency: data.frequency,
      startDate: parseDate(data.startDate),
      endDate: data.endDate ? parseDate(data.endDate) : null,
      executionStartTime: data.executionStartTime,
      executionEndTime: data.executionEndTime,
      excludeWeekdays: data.excludeWeekdays,
      autoClose: data.autoClose,
      pinned: data.pinned,
      performerUserIds: data.performerUserIds,
      supervisorUserIds: data.supervisorUserIds,
      followerUserIds: data.followerUserIds,
      performerRoles: data.performerRoles,
      supervisorRoles: data.supervisorRoles,
      followerRoles: data.followerRoles,
      businessId: orgId,
    },
  });
  revalidatePath("/dashboard/tasks/schedules");
  redirect("/dashboard/tasks/schedules");
}

export async function updateSchedule(id: string, data: ScheduleInput) {
  const orgId = await assertOwnerOfSchedule(id);
  await validateOrgScope(orgId, data.templateId, data.locationId);
  await prisma.checklistSchedule.update({
    where: { id },
    data: {
      templateId: data.templateId,
      locationId: data.locationId,
      frequency: data.frequency,
      startDate: parseDate(data.startDate),
      endDate: data.endDate ? parseDate(data.endDate) : null,
      executionStartTime: data.executionStartTime,
      executionEndTime: data.executionEndTime,
      excludeWeekdays: data.excludeWeekdays,
      autoClose: data.autoClose,
      pinned: data.pinned,
      performerUserIds: data.performerUserIds,
      supervisorUserIds: data.supervisorUserIds,
      followerUserIds: data.followerUserIds,
      performerRoles: data.performerRoles,
      supervisorRoles: data.supervisorRoles,
      followerRoles: data.followerRoles,
    },
  });
  revalidatePath("/dashboard/tasks/schedules");
}

export async function deleteSchedule(id: string) {
  await assertOwnerOfSchedule(id);
  await prisma.checklistSchedule.delete({ where: { id } });
  revalidatePath("/dashboard/tasks/schedules");
  redirect("/dashboard/tasks/schedules");
}
