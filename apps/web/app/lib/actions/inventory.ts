'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateIngredientSchema, UpdateIngredientSchema } from '@/app/lib/definitions';
import type { IngredientFormState } from '@/app/lib/definitions';
import { scopedLocationId, locationScope } from '@/app/lib/auth/scope';

// --- INGREDIENTS ---

export async function createIngredient(prevState: IngredientFormState, formData: FormData) {
    const validatedFields = CreateIngredientSchema.safeParse({
        name: formData.get('name'),
        category: formData.get('category'),
        pricingUnit: formData.get('pricingUnit'),
        pricePerUnit: formData.get('pricePerUnit'),
        yieldPercent: formData.get('yieldPercent'),
        allergens: formData.get('allergens'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios. No se pudo crear el ingrediente.',
        };
    }

    const { name, category, pricingUnit, pricePerUnit, yieldPercent, allergens } = validatedFields.data;

    try {
        await prisma.ingredient.create({
            data: {
                locationId: await scopedLocationId(),
                name,
                category,
                pricingUnit, // Schema validation ensures it matches expected string/enum
                pricePerUnit,
                yieldPercent,
                allergens,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo crear el ingrediente.',
        };
    }

    revalidatePath('/dashboard/inventory');
    redirect('/dashboard/inventory');
}

export async function updateIngredient(
    id: string,
    prevState: IngredientFormState,
    formData: FormData,
) {
    const validatedFields = UpdateIngredientSchema.safeParse({
        id: id,
        name: formData.get('name'),
        category: formData.get('category'),
        pricingUnit: formData.get('pricingUnit'),
        pricePerUnit: formData.get('pricePerUnit'),
        yieldPercent: formData.get('yieldPercent'),
        allergens: formData.get('allergens'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios. No se pudo actualizar el ingrediente.',
        };
    }

    const { name, category, pricingUnit, pricePerUnit, yieldPercent, allergens } = validatedFields.data;

    // Verifica que el ingrediente pertenece al local del usuario antes de editar.
    const inScope = await prisma.ingredient.findFirst({
        where: { ...(await locationScope()), id },
        select: { id: true },
    });
    if (!inScope) {
        return { message: 'No autorizado: el ingrediente no pertenece a tu local.' };
    }

    try {
        await prisma.ingredient.update({
            where: { id },
            data: {
                name,
                category,
                pricingUnit,
                pricePerUnit,
                yieldPercent,
                allergens,
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo actualizar el ingrediente.',
        };
    }

    revalidatePath('/dashboard/inventory');
    redirect('/dashboard/inventory');
}

export async function deleteIngredient(id: string) {
    try {
        const scoped = await prisma.ingredient.findFirst({
            where: { ...(await locationScope()), id },
            select: { id: true },
        });
        if (!scoped) {
            return { message: 'No autorizado: el ingrediente no pertenece a tu local.' };
        }
        await prisma.ingredient.delete({
            where: { id },
        });
        revalidatePath('/dashboard/inventory');
        return { message: 'Ingrediente eliminado.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error de base de datos: No se pudo eliminar el ingrediente.' };
    }
}
