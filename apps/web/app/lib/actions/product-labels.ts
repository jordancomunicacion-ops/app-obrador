"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import type { LabelStorageMode } from "@prisma/client";

export async function createLabel(data: {
  productName: string;
  lotNumber?: string;
  productionDate?: string; // YYYY-MM-DD; default today
  expiryDate?: string | null;
  storageMode?: LabelStorageMode;
  allergens?: string[];
  ingredients?: string;
  weight?: string;
  note?: string;
  photoUrl?: string | null;
}) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  if (!data.productName?.trim()) throw new Error("Producto obligatorio");

  const locationId = await currentLocationId();
  const prod = data.productionDate
    ? new Date(`${data.productionDate}T00:00:00.000Z`)
    : new Date();

  const created = await prisma.productLabel.create({
    data: {
      ownerId: orgId,
      createdByUserId: session.user.id,
      locationId: locationId ?? null,
      productName: data.productName.trim(),
      lotNumber: data.lotNumber?.trim() || null,
      productionDate: prod,
      expiryDate: data.expiryDate ? new Date(`${data.expiryDate}T00:00:00.000Z`) : null,
      storageMode: data.storageMode ?? "REFRIGERATED",
      allergens: data.allergens ?? [],
      ingredients: data.ingredients?.trim() || null,
      weight: data.weight?.trim() || null,
      note: data.note?.trim() || null,
      photoUrl: data.photoUrl ?? null,
    },
  });
  revalidatePath("/dashboard/labels");
  revalidatePath("/dashboard/today/labels");
  return created;
}

export async function deleteLabel(id: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const label = await prisma.productLabel.findFirst({
    where: { id, ownerId: orgId },
    select: { id: true },
  });
  if (!label) throw new Error("Label not found");
  await prisma.productLabel.delete({ where: { id } });
  revalidatePath("/dashboard/labels");
  revalidatePath("/dashboard/today/labels");
}
