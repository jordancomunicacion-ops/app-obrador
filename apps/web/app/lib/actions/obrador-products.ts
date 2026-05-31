'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { scopedLocationId, locationScope } from '@/app/lib/auth/scope';

// Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011).
export const OBRADOR_ALLERGENS = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes', 'Soja', 'Leche',
  'Frutos de cáscara', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos',
] as const;

const num = z.coerce.number().optional().nullable();

const ObradorProductSchema = z.object({
  name: z.string().min(1, { message: 'El nombre comercial es obligatorio.' }),
  category: z.string().optional(),
  legalDenomination: z.string().optional(),
  conservationType: z.string().optional(),
  shelfLifeDays: z.coerce.number().int().min(0).optional().nullable(),
  ingredientsList: z.string().optional(),
  energyKcal: num,
  fat: num,
  saturatedFat: num,
  carbs: num,
  sugars: num,
  protein: num,
  salt: num,
});

export type ObradorProductFormState = {
  errors?: {
    name?: string[];
    category?: string[];
    shelfLifeDays?: string[];
  };
  message: string | null;
};

// Extrae y valida los campos comunes del formulario (crear/editar).
function parseForm(formData: FormData) {
  return ObradorProductSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    legalDenomination: formData.get('legalDenomination'),
    conservationType: formData.get('conservationType'),
    shelfLifeDays: formData.get('shelfLifeDays') || null,
    ingredientsList: formData.get('ingredientsList'),
    energyKcal: formData.get('energyKcal') || null,
    fat: formData.get('fat') || null,
    saturatedFat: formData.get('saturatedFat') || null,
    carbs: formData.get('carbs') || null,
    sugars: formData.get('sugars') || null,
    protein: formData.get('protein') || null,
    salt: formData.get('salt') || null,
  });
}

// Construye el bloque ProductSanitaryInfo a partir del formulario.
function sanitaryData(data: z.infer<typeof ObradorProductSchema>, allergens: string[]) {
  return {
    legalDenomination: data.legalDenomination || null,
    conservationType: data.conservationType || null,
    shelfLifeDays: data.shelfLifeDays ?? null,
    ingredientsList: data.ingredientsList || null,
    allergens: allergens.length > 0 ? allergens.join(', ') : null,
    energyKcal: data.energyKcal ?? null,
    fat: data.fat ?? null,
    saturatedFat: data.saturatedFat ?? null,
    carbs: data.carbs ?? null,
    sugars: data.sugars ?? null,
    protein: data.protein ?? null,
    salt: data.salt ?? null,
  };
}

export async function createObradorProduct(
  prevState: ObradorProductFormState,
  formData: FormData,
): Promise<ObradorProductFormState> {
  const validated = parseForm(formData);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios.',
    };
  }
  const allergens = formData.getAll('allergens').map(String);

  try {
    await prisma.masterProduct.create({
      data: {
        name: validated.data.name,
        category: validated.data.category || null,
        isObrador: true,
        locationId: await scopedLocationId(),
        sanitaryInfo: { create: sanitaryData(validated.data, allergens) },
      },
    });
  } catch (error) {
    return { message: 'Error al crear el producto de obrador.' };
  }

  revalidatePath('/dashboard/obrador/products');
  redirect('/dashboard/obrador/products');
}

export async function updateObradorProduct(
  id: string,
  prevState: ObradorProductFormState,
  formData: FormData,
): Promise<ObradorProductFormState> {
  const validated = parseForm(formData);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Faltan campos obligatorios.',
    };
  }
  const allergens = formData.getAll('allergens').map(String);

  try {
    // Acotado por local: solo actualiza si pertenece al ámbito actual.
    const existing = await prisma.masterProduct.findFirst({
      where: { id, isObrador: true, ...(await locationScope()) },
      select: { id: true },
    });
    if (!existing) return { message: 'Producto no encontrado.' };

    await prisma.masterProduct.update({
      where: { id },
      data: {
        name: validated.data.name,
        category: validated.data.category || null,
        sanitaryInfo: {
          upsert: {
            create: sanitaryData(validated.data, allergens),
            update: sanitaryData(validated.data, allergens),
          },
        },
      },
    });
  } catch (error) {
    return { message: 'Error al actualizar el producto de obrador.' };
  }

  revalidatePath('/dashboard/obrador/products');
  redirect('/dashboard/obrador/products');
}

export async function deleteObradorProduct(id: string) {
  const existing = await prisma.masterProduct.findFirst({
    where: { id, isObrador: true, ...(await locationScope()) },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.masterProduct.delete({ where: { id } });
  revalidatePath('/dashboard/obrador/products');
}
