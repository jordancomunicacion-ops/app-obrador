'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { scopedLocationId, locationScope } from '@/app/lib/auth/scope';

export const CUSTOMER_TYPES = [
  'Consumidor final',
  'Minorista',
  'Profesional (HORECA)',
  'Online',
  'Venta Directa',
] as const;

const CustomerSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
  customerType: z.string().optional(),
  nif: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  contactPerson: z.string().optional(),
});

export type ObradorCustomerFormState = {
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

export async function createObradorCustomer(
  prevState: ObradorCustomerFormState,
  formData: FormData,
): Promise<ObradorCustomerFormState> {
  const validated = parseForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Faltan campos obligatorios.' };
  }

  try {
    await prisma.customer.create({
      data: { ...data(validated.data), locationId: await scopedLocationId() },
    });
  } catch (error) {
    return { message: 'Error al crear el cliente.' };
  }

  revalidatePath('/dashboard/obrador/customers');
  redirect('/dashboard/obrador/customers');
}

export async function updateObradorCustomer(
  id: string,
  prevState: ObradorCustomerFormState,
  formData: FormData,
): Promise<ObradorCustomerFormState> {
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

  revalidatePath('/dashboard/obrador/customers');
  redirect('/dashboard/obrador/customers');
}

export async function deleteObradorCustomer(id: string) {
  const existing = await prisma.customer.findFirst({
    where: { id, ...(await locationScope()) },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.customer.delete({ where: { id } });
  revalidatePath('/dashboard/obrador/customers');
}
