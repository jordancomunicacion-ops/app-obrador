"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import type { CashClosingShift } from "@prisma/client";

function parseDate(s: string) {
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`);
  return d;
}

function computeDiff(input: {
  cashAmount: number;
  expectedCashAmount: number;
}): number {
  return Number(
    (input.cashAmount - input.expectedCashAmount).toFixed(2),
  );
}

export async function createOrUpdateClosing(data: {
  date: string;
  shift: CashClosingShift;
  cashAmount: number;
  expectedCashAmount: number;
  cardAmount: number;
  otherAmount: number;
  tips: number;
  notes?: string;
  photoUrl?: string | null;
}) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");
  const locationId = await currentLocationId();
  const date = parseDate(data.date);

  const existing = await prisma.cashClosing.findFirst({
    where: {
      ownerId: orgId,
      locationId: locationId ?? null,
      date,
      shift: data.shift,
    },
  });
  if (existing?.isLocked) throw new Error("Cierre bloqueado, no se puede modificar");

  const diff = computeDiff({
    cashAmount: data.cashAmount,
    expectedCashAmount: data.expectedCashAmount,
  });

  const payload = {
    ownerId: orgId,
    locationId: locationId ?? null,
    closedByUserId: session.user.id,
    date,
    shift: data.shift,
    cashAmount: data.cashAmount,
    expectedCashAmount: data.expectedCashAmount,
    cardAmount: data.cardAmount,
    otherAmount: data.otherAmount,
    tips: data.tips,
    diff,
    notes: data.notes?.trim() || null,
    photoUrl: data.photoUrl ?? null,
  };

  if (existing) {
    await prisma.cashClosing.update({ where: { id: existing.id }, data: payload });
  } else {
    await prisma.cashClosing.create({ data: payload });
  }

  revalidatePath("/dashboard/cash");
  revalidatePath("/dashboard/today/cash");
}

export async function lockClosing(id: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const c = await prisma.cashClosing.findFirst({ where: { id, ownerId: orgId } });
  if (!c) throw new Error("Closing not found");
  if (c.isLocked) return;
  await prisma.cashClosing.update({ where: { id }, data: { isLocked: true } });
  revalidatePath("/dashboard/cash");
}

export async function deleteClosing(id: string) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");
  if (session.user.id !== orgId) throw new Error("Forbidden");
  const c = await prisma.cashClosing.findFirst({ where: { id, ownerId: orgId } });
  if (!c) throw new Error("Closing not found");
  await prisma.cashClosing.delete({ where: { id } });
  revalidatePath("/dashboard/cash");
}
