'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function saveObradorConfig(formData: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const data = {
    businessName: formData.businessName,
    companyName: formData.companyName,
    nif: formData.nif,
    address: formData.address,
    phone: formData.phone,
    email: formData.email,
    activity: formData.activity,
    registryType: formData.registryType,
    registryNumber: formData.registryNumber,
    region: formData.region,
    status: formData.status,
    ownerId: session.user.id,
  };

  await prisma.obradorConfig.upsert({
    where: { id: 'default' },
    update: data,
    create: { ...data, id: 'default' },
  });

  revalidatePath('/dashboard/obrador/config');
}

export async function createObradorProduct(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const product = await prisma.obradorProduct.create({
    data: {
      ...data,
      ownerId: session.user.id,
    },
  });

  revalidatePath('/dashboard/obrador/products');
  return product;
}

export async function createObradorBatch(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('No autorizado');

  const batch = await prisma.obradorProductionBatch.create({
    data: {
      ...data,
      ownerId: session.user.id,
    },
  });

  revalidatePath('/dashboard/obrador/production');
  return batch;
}

export async function getObradorProducts() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.obradorProduct.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
}
