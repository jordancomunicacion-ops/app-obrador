'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, currentOrgId } from '@/auth';
import { locationScope } from '@/app/lib/auth/scope';
import { uploadPhoto } from '@/app/lib/storage/spaces';
import type { LabelStorageMode, Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Productos: marcar/editar la venta online de un MasterProduct del local.
// ---------------------------------------------------------------------------

const OnlineSaleSchema = z.object({
  isSellableOnline: z.boolean(),
  salePrice: z.number().nonnegative().nullable(),
  onlineDescription: z.string().optional(),
  onlineImageUrl: z.string().optional(),
  onlineCategory: z.string().optional(),
});

export type OnlineSaleFormState = {
  message: string | null;
  error?: string;
};

function parseNumber(v: FormDataEntryValue | null): number | null {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export async function updateOnlineSale(
  productId: string,
  _prevState: OnlineSaleFormState,
  formData: FormData,
): Promise<OnlineSaleFormState> {
  const parsed = OnlineSaleSchema.safeParse({
    isSellableOnline: formData.get('isSellableOnline') === 'on',
    salePrice: parseNumber(formData.get('salePrice')),
    onlineDescription: formData.get('onlineDescription') ?? undefined,
    onlineImageUrl: formData.get('onlineImageUrl') ?? undefined,
    onlineCategory: formData.get('onlineCategory') ?? undefined,
  });
  if (!parsed.success) {
    return { message: null, error: 'Datos inválidos.' };
  }
  const d = parsed.data;

  if (d.isSellableOnline && (d.salePrice == null || d.salePrice <= 0)) {
    return { message: null, error: 'Pon un precio de venta para activar la venta web.' };
  }

  // Scope por local: solo se actualiza si el producto pertenece al local activo.
  const result = await prisma.masterProduct.updateMany({
    where: { id: productId, ...(await locationScope()) },
    data: {
      isSellableOnline: d.isSellableOnline,
      salePrice: d.salePrice,
      onlineDescription: d.onlineDescription?.trim() || null,
      onlineImageUrl: d.onlineImageUrl?.trim() || null,
      onlineCategory: d.onlineCategory?.trim() || null,
    },
  });
  if (result.count === 0) {
    return { message: null, error: 'Producto no encontrado en este local.' };
  }

  revalidatePath('/dashboard/products');
  revalidatePath(`/dashboard/products/${productId}/edit`);
  revalidatePath('/dashboard/ecommerce/products');
  return { message: 'Venta web guardada.' };
}

/** Sube una imagen de venta al CDN. Para el componente ImageUpload. */
export async function uploadEcommerceImage(
  formData: FormData,
): Promise<{ success?: boolean; imageUrl?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'No autorizado.' };
  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No se seleccionó ningún archivo.' };
  if (!file.type.startsWith('image/')) return { error: 'El archivo debe ser una imagen.' };
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const up = await uploadPhoto(buf, { prefix: 'ecommerce', maxWidth: 1280 });
    return { success: true, imageUrl: up.url };
  } catch (e) {
    console.error('[ecommerce] upload error', e);
    return { error: 'No se pudo subir la imagen.' };
  }
}

/** Cambia solo la categoría de tienda (organizar desde Productos online). */
export async function setOnlineCategory(
  productId: string,
  onlineCategory: string,
): Promise<{ ok: boolean; error?: string }> {
  const result = await prisma.masterProduct.updateMany({
    where: { id: productId, ...(await locationScope()) },
    data: { onlineCategory: onlineCategory || null },
  });
  if (result.count === 0) return { ok: false, error: 'Producto no encontrado.' };
  revalidatePath('/dashboard/ecommerce/products');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Pedidos: avanzar el estado del workflow.
// ---------------------------------------------------------------------------

const STATUSES = ['NEW', 'IN_PRODUCTION', 'LABELED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type OnlineOrderStatus = (typeof STATUSES)[number];

export async function updateOnlineOrderStatus(
  orderId: string,
  status: OnlineOrderStatus,
): Promise<{ ok: boolean; error?: string }> {
  if (!STATUSES.includes(status)) return { ok: false, error: 'Estado inválido.' };

  const result = await prisma.onlineOrder.updateMany({
    where: { id: orderId, ...(await locationScope()) },
    data: { status },
  });
  if (result.count === 0) return { ok: false, error: 'Pedido no encontrado en este local.' };

  revalidatePath('/dashboard/ecommerce/orders');
  revalidatePath(`/dashboard/ecommerce/orders/${orderId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Producción + etiquetado reales desde un pedido online.
// ---------------------------------------------------------------------------

export type OrderActionResult = { ok: boolean; message?: string; error?: string };

const CONSERVATION_TO_STORAGE: Record<string, LabelStorageMode> = {
  refrigerado: 'REFRIGERATED',
  congelado: 'FROZEN',
  ambiente: 'AMBIENT',
};

function ymd(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * Inicia la producción de un pedido: crea un lote (ObradorProductionBatch) por
 * cada línea con producto de catálogo del local, vinculado al cliente del
 * pedido, y pasa el pedido a IN_PRODUCTION. Los lotes aparecen en Producción.
 */
export async function startOrderProduction(orderId: string): Promise<OrderActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'No autorizado.' };
  const orgId = await currentOrgId();

  const order = await prisma.onlineOrder.findFirst({
    where: { id: orderId, ...(await locationScope()) },
    include: { items: true },
  });
  if (!order) return { ok: false, error: 'Pedido no encontrado en este local.' };
  if (order.status !== 'NEW') {
    return { ok: false, error: 'La producción ya se había iniciado.' };
  }

  let created = 0;
  let skipped = 0;
  for (const item of order.items) {
    if (!item.masterProductId) {
      skipped++;
      continue;
    }
    const product = await prisma.masterProduct.findFirst({
      where: { id: item.masterProductId, locationId: order.locationId },
      include: { sanitaryInfo: true },
    });
    if (!product) {
      skipped++;
      continue;
    }

    const prodDate = new Date();
    const shelf = product.sanitaryInfo?.shelfLifeDays ?? 30;
    const expiry = new Date(prodDate.getTime() + shelf * 24 * 60 * 60 * 1000);
    const datePart = ymd(prodDate);
    const prodPart =
      product.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'PROD';
    const prefix = `L-${datePart}-${prodPart}-`;
    const sameDay = await prisma.obradorProductionBatch.count({
      where: { batchCode: { startsWith: prefix } },
    });
    const batchCode = `${prefix}${String(sameDay + 1).padStart(3, '0')}`;

    await prisma.obradorProductionBatch.create({
      data: {
        batchCode,
        masterProductId: product.id,
        customerId: order.customerId ?? null,
        productionDate: prodDate,
        expiryDate: expiry,
        quantityProduced: item.quantity,
        unit: product.sanitaryInfo?.saleFormat || 'ud',
        operatorName: session.user.name ?? null,
        observations: `Pedido online ${order.reference}`,
        status: 'abierto',
        businessId: orgId,
      },
    });
    created++;
  }

  await prisma.onlineOrder.update({
    where: { id: orderId },
    data: { status: 'IN_PRODUCTION' },
  });
  revalidatePath(`/dashboard/ecommerce/orders/${orderId}`);
  revalidatePath('/dashboard/ecommerce/orders');
  revalidatePath('/dashboard/obrador/production');
  return {
    ok: true,
    message:
      `Producción iniciada: ${created} lote(s) creado(s)` +
      (skipped ? `, ${skipped} línea(s) sin ficha de producto (omitidas)` : ''),
  };
}

/**
 * Genera la etiqueta legal de venta (ProductLabel destination=SALE) por cada
 * línea con producto de catálogo, congelando el snapshot legal desde la ficha
 * sanitaria. Pasa el pedido a LABELED. El nº de lote de la etiqueta es la
 * referencia del pedido.
 */
export async function generateOrderLabels(orderId: string): Promise<OrderActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'No autorizado.' };
  const orgId = await currentOrgId();

  const order = await prisma.onlineOrder.findFirst({
    where: { id: orderId, ...(await locationScope()) },
    include: { items: true },
  });
  if (!order) return { ok: false, error: 'Pedido no encontrado en este local.' };
  if (order.status !== 'IN_PRODUCTION') {
    return { ok: false, error: 'El pedido debe estar en producción para etiquetar.' };
  }

  let created = 0;
  let skipped = 0;
  for (const item of order.items) {
    if (!item.masterProductId) {
      skipped++;
      continue;
    }
    const p = await prisma.masterProduct.findFirst({
      where: { id: item.masterProductId, locationId: order.locationId },
      include: { sanitaryInfo: true, location: true },
    });
    if (!p) {
      skipped++;
      continue;
    }
    const s = p.sanitaryInfo;
    const loc = p.location;
    const allergens = (s?.allergens || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const prodDate = new Date();
    const expiry = s?.shelfLifeDays
      ? new Date(prodDate.getTime() + s.shelfLifeDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.productLabel.create({
      data: {
        businessId: orgId,
        createdByUserId: session.user.id,
        locationId: loc?.id ?? order.locationId,
        destination: 'SALE',
        productName: p.name,
        lotNumber: order.reference,
        productionDate: prodDate,
        expiryDate: expiry,
        storageMode: CONSERVATION_TO_STORAGE[s?.conservationType ?? ''] ?? 'REFRIGERATED',
        allergens,
        ingredients: s?.ingredientsList ?? null,
        weight: s?.defaultWeight != null ? `${s.defaultWeight} g` : null,
        masterProductId: p.id,
        legalDenomination: s?.legalDenomination ?? null,
        registryNumber: loc?.registryNumber ?? null,
        origin: loc?.region ?? null,
        usageInstructions:
          s?.usageInstructions ??
          (s?.requiresCooking ? 'Cocinar completamente antes de su consumo.' : null),
        requiresCooking: s?.requiresCooking ?? null,
        labelTemplate: s?.labelTemplate || '100x70',
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
    });
    created++;
  }

  await prisma.onlineOrder.update({
    where: { id: orderId },
    data: { status: 'LABELED' },
  });
  revalidatePath(`/dashboard/ecommerce/orders/${orderId}`);
  revalidatePath('/dashboard/ecommerce/orders');
  revalidatePath('/dashboard/labels');
  return {
    ok: true,
    message:
      `Etiquetas de venta generadas: ${created}` +
      (skipped ? `, ${skipped} línea(s) sin ficha (omitidas)` : ''),
  };
}
