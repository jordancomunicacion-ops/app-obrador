"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/lib/auth/location";

/**
 * Devuelve el fichaje abierto (sin endAt) del usuario actual si existe.
 */
export async function getCurrentClockIn() {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) return null;
  return prisma.clockIn.findFirst({
    where: { ownerId: orgId, workerId: session.user.id, endAt: null },
    orderBy: { startAt: "desc" },
    include: { location: { select: { name: true } } },
  });
}

export async function clockIn(data: { photoUrl?: string | null; note?: string | null } = {}) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  // Bloquear si ya hay uno abierto
  const open = await prisma.clockIn.findFirst({
    where: { ownerId: orgId, workerId: session.user.id, endAt: null },
    select: { id: true },
  });
  if (open) throw new Error("Ya tienes un fichaje abierto");

  const locationId = await currentLocationId();

  const created = await prisma.clockIn.create({
    data: {
      ownerId: orgId,
      workerId: session.user.id,
      locationId: locationId ?? null,
      startAt: new Date(),
      startPhotoUrl: data.photoUrl ?? null,
      note: data.note ?? null,
    },
  });
  revalidatePath("/dashboard/today");
  revalidatePath("/dashboard/today/clock-in");
  revalidatePath("/dashboard/clock-in");
  return created;
}

export async function clockOut(data: { photoUrl?: string | null; note?: string | null } = {}) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  const open = await prisma.clockIn.findFirst({
    where: { ownerId: orgId, workerId: session.user.id, endAt: null },
    orderBy: { startAt: "desc" },
  });
  if (!open) throw new Error("No tienes ningún fichaje abierto");

  await prisma.clockIn.update({
    where: { id: open.id },
    data: {
      endAt: new Date(),
      endPhotoUrl: data.photoUrl ?? null,
      note: data.note != null ? data.note : open.note,
    },
  });
  revalidatePath("/dashboard/today");
  revalidatePath("/dashboard/today/clock-in");
  revalidatePath("/dashboard/clock-in");
}

/**
 * Admin/owner edita un fichaje (corregir hora salida olvidada, etc.).
 */
export async function adminUpdateClockIn(
  id: string,
  data: {
    startAt?: string; // ISO
    endAt?: string | null;
    note?: string | null;
  },
) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");
  if (session.user.id !== orgId) throw new Error("Forbidden");

  const target = await prisma.clockIn.findFirst({
    where: { id, ownerId: orgId },
    select: { id: true },
  });
  if (!target) throw new Error("Clock-in not found");

  await prisma.clockIn.update({
    where: { id },
    data: {
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt === undefined ? undefined : data.endAt ? new Date(data.endAt) : null,
      note: data.note === undefined ? undefined : data.note,
    },
  });
  revalidatePath("/dashboard/clock-in");
}

export async function adminDeleteClockIn(id: string) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");
  if (session.user.id !== orgId) throw new Error("Forbidden");

  const target = await prisma.clockIn.findFirst({
    where: { id, ownerId: orgId },
    select: { id: true },
  });
  if (!target) throw new Error("Clock-in not found");

  await prisma.clockIn.delete({ where: { id } });
  revalidatePath("/dashboard/clock-in");
}
