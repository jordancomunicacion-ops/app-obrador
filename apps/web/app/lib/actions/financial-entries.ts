"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import type { FinancialEntryType } from "@prisma/client";

function parseDate(s: string) {
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date ${s}`);
  return d;
}

export async function createEntry(data: {
  type: FinancialEntryType;
  category: string;
  date: string;
  amount: number;
  description?: string;
  receiptUrl?: string | null;
}) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  if (!data.category?.trim()) throw new Error("Categoría obligatoria");
  if (!(data.amount > 0)) throw new Error("Importe debe ser positivo");

  const locationId = await currentLocationId();

  await prisma.financialEntry.create({
    data: {
      ownerId: orgId,
      createdByUserId: session.user.id,
      locationId: locationId ?? null,
      type: data.type,
      category: data.category.trim(),
      date: parseDate(data.date),
      amount: data.amount,
      description: data.description?.trim() || null,
      receiptUrl: data.receiptUrl ?? null,
    },
  });
  revalidatePath("/dashboard/finance");
}

export async function deleteEntry(id: string) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");
  if (session.user.id !== orgId) throw new Error("Forbidden");

  const e = await prisma.financialEntry.findFirst({ where: { id, ownerId: orgId } });
  if (!e) throw new Error("Entry not found");
  await prisma.financialEntry.delete({ where: { id } });
  revalidatePath("/dashboard/finance");
}
