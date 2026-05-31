'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export type ObradorConfigFormState = { message: string | null; ok?: boolean };

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = (v ?? '').toString().trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function saveObradorConfig(
  prevState: ObradorConfigFormState,
  formData: FormData,
): Promise<ObradorConfigFormState> {
  const session = await auth();
  if (!session?.user?.id) return { message: 'No autorizado.' };

  const str = (k: string) => {
    const v = (formData.get(k) ?? '').toString().trim();
    return v || null;
  };

  const data = {
    businessName: str('businessName'),
    companyName: str('companyName'),
    nif: str('nif'),
    address: str('address'),
    phone: str('phone'),
    email: str('email'),
    registryType: str('registryType'),
    registryNumber: str('registryNumber'),
    region: str('region'),
    status: str('status') ?? 'no_iniciado',
    requestDate: parseDate(formData.get('requestDate')),
    resolutionDate: parseDate(formData.get('resolutionDate')),
    ownerId: session.user.id,
  };

  try {
    await prisma.obradorConfig.upsert({
      where: { id: 'default' },
      update: data,
      create: { ...data, id: 'default' },
    });
  } catch (error) {
    return { message: 'Error al guardar la configuración.' };
  }

  revalidatePath('/dashboard/obrador/config');
  return { message: 'Configuración guardada.', ok: true };
}
