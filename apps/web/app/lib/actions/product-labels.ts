"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import type { LabelStorageMode, LabelDestination, Prisma } from "@prisma/client";

export type NutritionSnapshot = {
  energyKj?: number | null;
  energyKcal?: number | null;
  fat?: number | null;
  saturatedFat?: number | null;
  carbs?: number | null;
  sugars?: number | null;
  protein?: number | null;
  salt?: number | null;
};

export type CreateLabelInput = {
  destination?: LabelDestination;
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
  // Etiqueta de venta (destination = SALE)
  masterProductId?: string | null;
  obradorBatchId?: string | null;
  legalDenomination?: string | null;
  registryNumber?: string | null;
  origin?: string | null;
  usageInstructions?: string | null;
  requiresCooking?: boolean | null;
  labelTemplate?: string | null;
  nutritionSnapshot?: NutritionSnapshot | null;
};

export async function createLabel(data: CreateLabelInput) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  if (!data.productName?.trim()) throw new Error("Producto obligatorio");

  const locationId = await currentLocationId();
  const prod = data.productionDate
    ? new Date(`${data.productionDate}T00:00:00.000Z`)
    : new Date();
  const isSale = data.destination === "SALE";

  const created = await prisma.productLabel.create({
    data: {
      ownerId: orgId,
      createdByUserId: session.user.id,
      locationId: locationId ?? null,
      destination: data.destination ?? "INTERNAL",
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
      // Campos de venta: solo se persisten (snapshot) si el destino es SALE.
      masterProductId: isSale ? data.masterProductId || null : null,
      obradorBatchId: isSale ? data.obradorBatchId || null : null,
      legalDenomination: isSale ? data.legalDenomination?.trim() || null : null,
      registryNumber: isSale ? data.registryNumber?.trim() || null : null,
      origin: isSale ? data.origin?.trim() || null : null,
      usageInstructions: isSale ? data.usageInstructions?.trim() || null : null,
      requiresCooking: isSale ? data.requiresCooking ?? null : null,
      labelTemplate: isSale ? data.labelTemplate || "100x70" : null,
      ...(isSale && data.nutritionSnapshot
        ? { nutritionSnapshot: data.nutritionSnapshot as Prisma.InputJsonValue }
        : {}),
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

// Mapea el tipo de conservación de la ficha sanitaria al enum de la etiqueta.
const CONSERVATION_TO_STORAGE: Record<string, LabelStorageMode> = {
  refrigerado: "REFRIGERATED",
  congelado: "FROZEN",
  ambiente: "AMBIENT",
};

export type ObradorBatchOption = {
  id: string;
  batchCode: string;
  productionDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
};

export type ObradorProductOption = {
  id: string; // masterProductId
  name: string;
  legalDenomination: string | null;
  storageMode: LabelStorageMode;
  usageInstructions: string | null;
  requiresCooking: boolean;
  labelTemplate: string;
  defaultWeight: number | null;
  saleFormat: string | null;
  shelfLifeDays: number | null;
  ingredientsText: string | null;
  allergens: string[];
  nutrition: NutritionSnapshot;
  registryNumber: string | null;
  origin: string | null;
  operator: string | null;
  batches: ObradorBatchOption[];
};

export type ObradorLabelSource = {
  products: ObradorProductOption[];
};

/**
 * Construye las opciones para la etiqueta de venta a partir de los LOTES de
 * producción del obrador (aislados por ownerId), agrupados por su ficha
 * MasterProduct + ProductSanitaryInfo. Los datos legales (registro, operador,
 * origen) salen del local de la ficha, con ObradorConfig como respaldo.
 */
export async function getObradorLabelSource(): Promise<ObradorLabelSource> {
  const orgId = await currentOrgId();
  if (!orgId) return { products: [] };

  const [batches, config] = await Promise.all([
    prisma.obradorProductionBatch.findMany({
      where: {
        ownerId: orgId,
        masterProductId: { not: null },
        status: { not: "retirado" },
      },
      include: {
        masterProduct: { include: { sanitaryInfo: true, location: true } },
      },
      orderBy: { productionDate: "desc" },
      take: 200,
    }),
    prisma.obradorConfig.findUnique({ where: { id: "default" } }),
  ]);

  const fallbackRegistry = config?.registryNumber ?? null;
  const fallbackOperator =
    [config?.companyName || config?.businessName, config?.address].filter(Boolean).join(" - ") ||
    null;
  const fallbackOrigin = config?.region ?? null;

  const byProduct = new Map<string, ObradorProductOption>();

  for (const b of batches) {
    const p = b.masterProduct;
    if (!p) continue;
    const s = p.sanitaryInfo;

    if (!byProduct.has(p.id)) {
      const allergenSet = new Set<string>();
      (s?.allergens || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((a) => allergenSet.add(a));

      const loc = p.location;
      const operator =
        [loc?.companyName || loc?.name, loc?.address].filter(Boolean).join(" - ") || null;

      byProduct.set(p.id, {
        id: p.id,
        name: p.name,
        legalDenomination: s?.legalDenomination ?? null,
        storageMode: CONSERVATION_TO_STORAGE[s?.conservationType ?? ""] ?? "REFRIGERATED",
        usageInstructions: s?.usageInstructions ?? null,
        requiresCooking: s?.requiresCooking ?? true,
        labelTemplate: s?.labelTemplate || "100x70",
        defaultWeight: s?.defaultWeight ?? null,
        saleFormat: s?.saleFormat ?? null,
        shelfLifeDays: s?.shelfLifeDays ?? null,
        ingredientsText: s?.ingredientsList ?? null,
        allergens: Array.from(allergenSet),
        nutrition: {
          energyKj: s?.energyKj ?? null,
          energyKcal: s?.energyKcal ?? null,
          fat: s?.fat ?? null,
          saturatedFat: s?.saturatedFat ?? null,
          carbs: s?.carbs ?? null,
          sugars: s?.sugars ?? null,
          protein: s?.protein ?? null,
          salt: s?.salt ?? null,
        },
        registryNumber: loc?.registryNumber ?? fallbackRegistry,
        origin: loc?.region ?? fallbackOrigin,
        operator: operator ?? fallbackOperator,
        batches: [],
      });
    }

    byProduct.get(p.id)!.batches.push({
      id: b.id,
      batchCode: b.batchCode,
      productionDate: b.productionDate.toISOString().slice(0, 10),
      expiryDate: b.expiryDate.toISOString().slice(0, 10),
    });
  }

  return { products: Array.from(byProduct.values()) };
}

/**
 * Crea (o reutiliza) la etiqueta de venta de un lote de producción, congelando
 * el snapshot legal desde la ficha del producto (MasterProduct + sanitaryInfo)
 * y los datos del local. Idempotente: si el lote ya tiene una etiqueta de venta,
 * devuelve esa. Pensada para el flujo de un clic "generar+imprimir" desde Producción.
 */
export async function ensureSaleLabelForBatch(batchId: string): Promise<{ id: string }> {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  const existing = await prisma.productLabel.findFirst({
    where: { ownerId: orgId, obradorBatchId: batchId, destination: "SALE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (existing) return existing;

  const batch = await prisma.obradorProductionBatch.findFirst({
    where: { id: batchId, ownerId: orgId },
    include: { masterProduct: { include: { sanitaryInfo: true, location: true } } },
  });
  if (!batch) throw new Error("Lote no encontrado");
  if (!batch.masterProduct) {
    throw new Error("El lote no tiene ficha de producto; no se puede generar la etiqueta de venta.");
  }

  const p = batch.masterProduct;
  const s = p.sanitaryInfo;
  const loc = p.location;
  const config = await prisma.obradorConfig.findUnique({ where: { id: "default" } });

  const allergens = (s?.allergens || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const locationId = await currentLocationId();

  const created = await prisma.productLabel.create({
    data: {
      ownerId: orgId,
      createdByUserId: session.user.id,
      locationId: locationId ?? p.locationId ?? null,
      destination: "SALE",
      productName: p.name,
      lotNumber: batch.batchCode,
      productionDate: batch.productionDate,
      expiryDate: batch.expiryDate,
      storageMode: CONSERVATION_TO_STORAGE[s?.conservationType ?? ""] ?? "REFRIGERATED",
      allergens,
      ingredients: s?.ingredientsList ?? null,
      weight: s?.defaultWeight != null ? `${s.defaultWeight} g` : null,
      masterProductId: p.id,
      obradorBatchId: batch.id,
      legalDenomination: s?.legalDenomination ?? null,
      registryNumber: loc?.registryNumber ?? config?.registryNumber ?? null,
      origin: loc?.region ?? config?.region ?? null,
      usageInstructions:
        s?.usageInstructions ??
        (s?.requiresCooking ? "Cocinar completamente antes de su consumo." : null),
      requiresCooking: s?.requiresCooking ?? null,
      labelTemplate: s?.labelTemplate || "100x70",
      nutritionSnapshot: {
        energyKj: s?.energyKj ?? null,
        energyKcal: s?.energyKcal ?? null,
        fat: s?.fat ?? null,
        saturatedFat: s?.saturatedFat ?? null,
        carbs: s?.carbs ?? null,
        sugars: s?.sugars ?? null,
        protein: s?.protein ?? null,
        salt: s?.salt ?? null,
      } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/labels");
  revalidatePath("/dashboard/today/labels");
  return created;
}
