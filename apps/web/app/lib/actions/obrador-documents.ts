'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const DOCUMENT_CATEGORIES = [
  'Registro',
  'APPCC',
  'Limpieza',
  'Plagas',
  'Formación',
  'Fichas',
  'Albaranes',
  'Facturas',
  'Certificados',
  'Incidencias',
  'Retiradas',
  'Inspecciones',
] as const;

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
  const session = await auth();

  try {
    await prisma.obradorSanitaryDocument.create({
      data: {
        title: d.title,
        category: d.category,
        fileUrl: d.fileUrl,
        expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
        ownerId: session?.user?.id ?? null,
      },
    });
  } catch (error) {
    return { message: 'Error al guardar el documento.' };
  }

  revalidatePath('/dashboard/obrador/documents');
  redirect('/dashboard/obrador/documents');
}

export async function deleteObradorDocument(id: string) {
  const session = await auth();
  const existing = await prisma.obradorSanitaryDocument.findFirst({
    where: { id, ownerId: session?.user?.id ?? '__none__' },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.obradorSanitaryDocument.delete({ where: { id } });
  revalidatePath('/dashboard/obrador/documents');
}
