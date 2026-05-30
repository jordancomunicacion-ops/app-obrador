"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";

function startOfDayUTC(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function parseDate(s: string) {
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`);
  return d;
}

async function assertAdmin() {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");
  if (session.user.id !== orgId) throw new Error("Forbidden");
  return { adminId: session.user.id, orgId };
}

export async function createShift(data: {
  workerId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  locationId?: string | null;
  note?: string | null;
}) {
  const { orgId } = await assertAdmin();

  // verificar worker dentro del org
  const worker = await prisma.user.findFirst({
    where: { id: data.workerId, OR: [{ id: orgId }, { adminId: orgId }] },
    select: { id: true },
  });
  if (!worker) throw new Error("Worker not in org");

  if (data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: data.locationId, ownerId: orgId },
    });
    if (!loc) throw new Error("Invalid location");
  }

  await prisma.shift.create({
    data: {
      ownerId: orgId,
      workerId: data.workerId,
      locationId: data.locationId ?? null,
      date: parseDate(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes ?? 0,
      note: data.note?.trim() || null,
    },
  });
  revalidatePath("/dashboard/shifts");
  revalidatePath("/dashboard/today/schedule");
}

export async function updateShift(
  id: string,
  data: {
    date?: string;
    startTime?: string;
    endTime?: string;
    breakMinutes?: number;
    locationId?: string | null;
    note?: string | null;
  },
) {
  const { orgId } = await assertAdmin();
  const shift = await prisma.shift.findFirst({
    where: { id, ownerId: orgId },
  });
  if (!shift) throw new Error("Shift not found");

  await prisma.shift.update({
    where: { id },
    data: {
      date: data.date ? parseDate(data.date) : undefined,
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes,
      locationId: data.locationId === undefined ? undefined : data.locationId,
      note: data.note === undefined ? undefined : data.note?.trim() || null,
    },
  });
  revalidatePath("/dashboard/shifts");
  revalidatePath("/dashboard/today/schedule");
}

export async function deleteShift(id: string) {
  const { orgId } = await assertAdmin();
  const shift = await prisma.shift.findFirst({
    where: { id, ownerId: orgId },
    select: { id: true },
  });
  if (!shift) throw new Error("Shift not found");
  await prisma.shift.delete({ where: { id } });
  revalidatePath("/dashboard/shifts");
  revalidatePath("/dashboard/today/schedule");
}

/**
 * Copia todos los turnos de la semana origen a la semana destino para los mismos
 * trabajadores. Si ya existen turnos en destino, NO se sobreescriben (se añaden).
 */
export async function copyWeek(fromMondayISO: string, toMondayISO: string) {
  const { orgId } = await assertAdmin();

  const from = parseDate(fromMondayISO);
  const to = parseDate(toMondayISO);
  const fromEnd = new Date(from);
  fromEnd.setUTCDate(fromEnd.getUTCDate() + 7);

  const source = await prisma.shift.findMany({
    where: { ownerId: orgId, date: { gte: from, lt: fromEnd } },
  });

  if (source.length === 0) return { created: 0 };

  const dayDiffMs = to.getTime() - from.getTime();
  await prisma.shift.createMany({
    data: source.map((s) => ({
      ownerId: orgId,
      workerId: s.workerId,
      locationId: s.locationId,
      date: new Date(s.date.getTime() + dayDiffMs),
      startTime: s.startTime,
      endTime: s.endTime,
      breakMinutes: s.breakMinutes,
      note: s.note,
    })),
  });
  revalidatePath("/dashboard/shifts");
  return { created: source.length };
}
