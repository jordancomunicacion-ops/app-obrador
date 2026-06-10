'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { resolveSubmittedLocationId, safeReturnTo, locationScope } from '@/app/lib/auth/scope';
import { currentBusinessId } from '@/app/lib/auth/business';

const CustomerSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
  customerType: z.string().optional(),
  nif: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  contactPerson: z.string().optional(),
});

export type CustomerFormState = {
  errors?: { name?: string[] };
  message: string | null;
};

function parseForm(formData: FormData) {
  return CustomerSchema.safeParse({
    name: formData.get('name'),
    customerType: formData.get('customerType'),
    nif: formData.get('nif'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    contactPerson: formData.get('contactPerson'),
  });
}

function data(d: z.infer<typeof CustomerSchema>) {
  return {
    name: d.name,
    customerType: d.customerType || null,
    nif: d.nif || null,
    address: d.address || null,
    phone: d.phone || null,
    email: d.email || null,
    contactPerson: d.contactPerson || null,
  };
}

export async function createCustomer(
  prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const validated = parseForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Faltan campos obligatorios.' };
  }

  try {
    await prisma.customer.create({
      data: {
        ...data(validated.data),
        businessId: await currentBusinessId(),
        locationId: await resolveSubmittedLocationId(formData.get('locationId')),
      },
    });
  } catch (error) {
    return { message: 'Error al crear el cliente.' };
  }

  revalidatePath('/dashboard/settings/customers');
  revalidatePath('/dashboard/settings/locations/[id]', 'page');
  redirect(safeReturnTo(formData.get('returnTo')) ?? '/dashboard/settings/customers');
}

export async function updateCustomer(
  id: string,
  prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const validated = parseForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Faltan campos obligatorios.' };
  }

  try {
    const existing = await prisma.customer.findFirst({
      where: { id, ...(await locationScope()) },
      select: { id: true },
    });
    if (!existing) return { message: 'Cliente no encontrado.' };

    await prisma.customer.update({ where: { id }, data: data(validated.data) });
  } catch (error) {
    return { message: 'Error al actualizar el cliente.' };
  }

  revalidatePath('/dashboard/settings/customers');
  revalidatePath('/dashboard/settings/locations/[id]', 'page');
  redirect('/dashboard/settings/customers');
}

export async function deleteCustomer(id: string) {
  const existing = await prisma.customer.findFirst({
    where: { id, ...(await locationScope()) },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.customer.delete({ where: { id } });
  revalidatePath('/dashboard/settings/customers');
  revalidatePath('/dashboard/settings/locations/[id]', 'page');
}
