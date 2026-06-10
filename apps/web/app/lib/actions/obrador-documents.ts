'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { resolveSubmittedLocationId, safeReturnTo, locationScope } from '@/app/lib/auth/scope';
import { currentBusinessId } from '@/app/lib/auth/business';

const DocSchema = z.object({
  title: z.string().min(1, { message: 'El título es obligatorio.' }),
  category: z.string().min(1, { message: 'La categoría es obligatoria.' }),
  fileUrl: z.string().url({ message: 'Debe ser una URL válida (https://...).' }),
  expiryDate: z.string().optional(),
});

export type ObradorDocumentFormState = {
  errors?: { title?: string[]; category?: string[]; fileUrl?: string[] };
  message: string | null;
};

export async function createObradorDocument(
  prevState: ObradorDocumentFormState,
  formData: FormData,
): Promise<ObradorDocumentFormState> {
  const validated = DocSchema.safeParse({
    title: formData.get('title'),
    category: formData.get('category'),
    fileUrl: formData.get('fileUrl'),
    expiryDate: formData.get('expiryDate'),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Revisa los campos.' };
  }
  const d = validated.data;
  const locationId = await resolveSubmittedLocationId(formData.get('locationId'));
  if (!locationId) return { message: 'Selecciona un local activo antes de subir documentos.' };

  try {
    await prisma.obradorSanitaryDocument.create({
      data: {
        title: d.title,
        category: d.category,
        fileUrl: d.fileUrl,
        expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
        businessId: await currentBusinessId(),
        locationId,
      },
    });
  } catch (error) {
    return { message: 'Error al guardar el documento.' };
  }

  revalidatePath('/dashboard/obrador/documents');
  revalidatePath('/dashboard/settings/locations/[id]', 'page');
  redirect(safeReturnTo(formData.get('returnTo')) ?? '/dashboard/obrador/documents');
}

export async function deleteObradorDocument(id: string) {
  const existing = await prisma.obradorSanitaryDocument.findFirst({
    where: { id, ...(await locationScope()) },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.obradorSanitaryDocument.delete({ where: { id } });
  revalidatePath('/dashboard/obrador/documents');
  revalidatePath('/dashboard/settings/locations/[id]', 'page');
}
