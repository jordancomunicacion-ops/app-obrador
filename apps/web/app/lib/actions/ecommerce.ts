'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { locationScope } from '@/app/lib/auth/scope';

// ---------------------------------------------------------------------------
// Productos: marcar/editar la venta online de un MasterProduct del local.
// ---------------------------------------------------------------------------

const OnlineSaleSchema = z.object({
  isSellableOnline: z.boolean(),
  salePrice: z.number().nonnegative().nullable(),
  onlineDescription: z.string().optional(),
  onlineImageUrl: z.string().optional(),
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
  });
  if (!parsed.success) {
    return { message: null, error: 'Datos inválidos.' };
  }
  const d = parsed.data;

  if (d.isSellableOnline && (d.salePrice == null || d.salePrice <= 0)) {
    return { message: null, error: 'Pon un precio de venta para activar la venta online.' };
  }

  // Scope por local: solo se actualiza si el producto pertenece al local activo.
  const result = await prisma.masterProduct.updateMany({
    where: { id: productId, ...(await locationScope()) },
    data: {
      isSellableOnline: d.isSellableOnline,
      salePrice: d.salePrice,
      onlineDescription: d.onlineDescription?.trim() || null,
      onlineImageUrl: d.onlineImageUrl?.trim() || null,
    },
  });
  if (result.count === 0) {
    return { message: null, error: 'Producto no encontrado en este local.' };
  }

  revalidatePath('/dashboard/ecommerce/products');
  redirect('/dashboard/ecommerce/products');
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
