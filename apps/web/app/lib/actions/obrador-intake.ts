'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

const IntakeSchema = z.object({
  supplierId: z.string().optional(),
  supplierName: z.string().min(1, { message: 'El proveedor es obligatorio.' }),
  masterProductId: z.string().optional(),
  productName: z.string().min(1, { message: 'El producto es obligatorio.' }),
  supplierBatch: z.string().optional(),
  receptionDate: z.string().optional(),
  expiryDate: z.string().optional(),
  quantityReceived: z.coerce.number().positive({ message: 'La cantidad debe ser > 0.' }),
  unit: z.string().min(1),
  receptionTemp: z.coerce.number().optional().nullable(),
  visualStatus: z.string().optional(),
  isApto: z.string().optional(),
  observations: z.string().optional(),
});

export type ObradorIntakeFormState = {
  errors?: {
    supplierName?: string[];
    productName?: string[];
    quantityReceived?: string[];
  };
  message: string | null;
};

export async function createObradorIntake(
  prevState: ObradorIntakeFormState,
  formData: FormData,
): Promise<ObradorIntakeFormState> {
  const validated = IntakeSchema.safeParse({
    supplierId: formData.get('supplierId'),
    supplierName: formData.get('supplierName'),
    masterProductId: formData.get('masterProductId'),
    productName: formData.get('productName'),
    supplierBatch: formData.get('supplierBatch'),
    receptionDate: formData.get('receptionDate'),
    expiryDate: formData.get('expiryDate'),
    quantityReceived: formData.get('quantityReceived'),
    unit: formData.get('unit') || 'kg',
    receptionTemp: formData.get('receptionTemp') || null,
    visualStatus: formData.get('visualStatus'),
    isApto: formData.get('isApto'),
    observations: formData.get('observations'),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Revisa los campos.' };
  }
  const d = validated.data;
  const session = await auth();

  try {
    await prisma.obradorRawMaterialEntry.create({
      data: {
        supplierId: d.supplierId || null,
        supplierName: d.supplierName,
        masterProductId: d.masterProductId || null,
        productName: d.productName,
        supplierBatch: d.supplierBatch || null,
        receptionDate: d.receptionDate ? new Date(d.receptionDate) : new Date(),
        expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
        quantityReceived: d.quantityReceived,
        unit: d.unit,
        receptionTemp: d.receptionTemp ?? null,
        visualStatus: d.visualStatus || null,
        isApto: d.isApto !== 'no',
        observations: d.observations || null,
        businessId: session?.user?.id ?? null,
      },
    });
  } catch (error) {
    return { message: 'Error al registrar la entrada.' };
  }

  revalidatePath('/dashboard/obrador/intake');
  redirect('/dashboard/obrador/intake');
}

export async function deleteObradorIntake(id: string) {
  const session = await auth();
  const existing = await prisma.obradorRawMaterialEntry.findFirst({
    where: { id, businessId: session?.user?.id ?? '__none__' },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.obradorRawMaterialEntry.delete({ where: { id } });
  revalidatePath('/dashboard/obrador/intake');
}
