'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { locationScope } from '@/app/lib/auth/scope';

const BatchSchema = z.object({
  masterProductId: z.string().min(1, { message: 'Selecciona un producto.' }),
  customerId: z.string().optional(),
  productionDate: z.string().min(1, { message: 'La fecha de producción es obligatoria.' }),
  expiryDate: z.string().min(1, { message: 'La fecha de caducidad es obligatoria.' }),
  quantityProduced: z.coerce.number().positive({ message: 'La cantidad debe ser > 0.' }),
  unit: z.string().min(1),
  operatorName: z.string().optional(),
  wasteQuantity: z.coerce.number().min(0).optional().nullable(),
  observations: z.string().optional(),
  status: z.string().optional(),
});

export type ObradorBatchFormState = {
  errors?: {
    masterProductId?: string[];
    productionDate?: string[];
    expiryDate?: string[];
    quantityProduced?: string[];
  };
  message: string | null;
};

function yyyymmdd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
}

export async function createObradorBatch(
  prevState: ObradorBatchFormState,
  formData: FormData,
): Promise<ObradorBatchFormState> {
  const validated = BatchSchema.safeParse({
    masterProductId: formData.get('masterProductId'),
    customerId: formData.get('customerId'),
    productionDate: formData.get('productionDate'),
    expiryDate: formData.get('expiryDate'),
    quantityProduced: formData.get('quantityProduced'),
    unit: formData.get('unit') || 'kg',
    operatorName: formData.get('operatorName'),
    wasteQuantity: formData.get('wasteQuantity') || null,
    observations: formData.get('observations'),
    status: formData.get('status') || 'abierto',
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Revisa los campos del lote.' };
  }
  const d = validated.data;
  const session = await auth();
  const businessId = session?.user?.id ?? null;

  // El producto debe ser de obrador y del local actual.
  const product = await prisma.masterProduct.findFirst({
    where: { id: d.masterProductId, isObrador: true, ...(await locationScope()) },
    select: { id: true, name: true },
  });
  if (!product) return { message: 'Producto no encontrado.' };

  const prodDate = new Date(d.productionDate);
  const datePart = yyyymmdd(prodDate);
  const prodPart =
    product.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4) || 'PROD';
  const prefix = `L-${datePart}-${prodPart}-`;
  const sameDay = await prisma.obradorProductionBatch.count({
    where: { batchCode: { startsWith: prefix } },
  });
  const batchCode = `${prefix}${String(sameDay + 1).padStart(3, '0')}`;

  try {
    await prisma.obradorProductionBatch.create({
      data: {
        batchCode,
        masterProductId: product.id,
        customerId: d.customerId || null,
        productionDate: prodDate,
        expiryDate: new Date(d.expiryDate),
        quantityProduced: d.quantityProduced,
        unit: d.unit,
        operatorName: d.operatorName || null,
        operatorId: businessId,
        wasteQuantity: d.wasteQuantity ?? null,
        observations: d.observations || null,
        status: d.status || 'abierto',
        businessId,
      },
    });
  } catch (error) {
    return { message: 'Error al guardar el lote.' };
  }

  revalidatePath('/dashboard/obrador/production');
  redirect('/dashboard/obrador/production');
}

export async function deleteObradorBatch(id: string) {
  const session = await auth();
  const existing = await prisma.obradorProductionBatch.findFirst({
    where: { id, businessId: session?.user?.id ?? '__none__' },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.obradorProductionBatch.delete({ where: { id } });
  revalidatePath('/dashboard/obrador/production');
}
