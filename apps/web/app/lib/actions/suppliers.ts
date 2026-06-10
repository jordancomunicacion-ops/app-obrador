'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { resolveSubmittedLocationId, safeReturnTo, locationScope } from '@/app/lib/auth/scope';
import { currentBusinessId } from '@/app/lib/auth/business';

const SupplierSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
  nif: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  productType: z.string().optional(),
  healthRegistry: z.string().optional(),
});

export type SupplierFormState = {
  errors?: { name?: string[] };
  message: string | null;
};

function parseForm(formData: FormData) {
  return SupplierSchema.safeParse({
    name: formData.get('name'),
    nif: formData.get('nif'),
    contactPerson: formData.get('contactPerson'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    productType: formData.get('productType'),
    healthRegistry: formData.get('healthRegistry'),
  });
}

function data(d: z.infer<typeof SupplierSchema>) {
  return {
    name: d.name,
    nif: d.nif || null,
    contactPerson: d.contactPerson || null,
    phone: d.phone || null,
    email: d.email || null,
    address: d.address || null,
    productType: d.productType || null,
    healthRegistry: d.healthRegistry || null,
  };
}

export async function createSupplier(
  prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const validated = parseForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Faltan campos obligatorios.' };
  }
  try {
    await prisma.supplier.create({
      data: {
        ...data(validated.data),
        businessId: await currentBusinessId(),
        locationId: await resolveSubmittedLocationId(formData.get('locationId')),
      },
    });
  } catch (error) {
    return { message: 'Error al crear el proveedor (¿nombre duplicado?).' };
  }

  revalidatePath('/dashboard/settings/suppliers');
  revalidatePath('/dashboard/settings/locations/[id]', 'page');
  redirect(safeReturnTo(formData.get('returnTo')) ?? '/dashboard/settings/suppliers');
}

export async function updateSupplier(
  id: string,
  prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const validated = parseForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Faltan campos obligatorios.' };
  }

  try {
    const existing = await prisma.supplier.findFirst({
      where: { id, ...(await locationScope()) },
      select: { id: true },
    });
    if (!existing) return { message: 'Proveedor no encontrado.' };

    await prisma.supplier.update({ where: { id }, data: data(validated.data) });
  } catch (error) {
    return { message: 'Error al actualizar el proveedor (¿nombre duplicado?).' };
  }

  revalidatePath('/dashboard/settings/suppliers');
  revalidatePath('/dashboard/settings/locations/[id]', 'page');
  redirect('/dashboard/settings/suppliers');
}

export async function deleteSupplier(id: string) {
  const existing = await prisma.supplier.findFirst({
    where: { id, ...(await locationScope()) },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.supplier.delete({ where: { id } });
  revalidatePath('/dashboard/settings/suppliers');
  revalidatePath('/dashboard/settings/locations/[id]', 'page');
}
