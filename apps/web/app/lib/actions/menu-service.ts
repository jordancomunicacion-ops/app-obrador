'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const MenuServiceItemSchema = z.object({
    recipeId: z.string(),
    estimatedPax: z.coerce.number().min(0),
});

const CreateMenuServiceSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    items: z.array(MenuServiceItemSchema).optional(),
});

export type MenuServiceFormState = {
    errors?: {
        name?: string[];
        startDate?: string[];
        endDate?: string[];
        items?: string[];
    };
    message?: string | null;
};

export async function createMenuService(prevState: MenuServiceFormState, formData: FormData) {
    const itemsJson = formData.get('items') as string;
    const itemsRaw = itemsJson ? JSON.parse(itemsJson) : [];

    const validatedFields = CreateMenuServiceSchema.safeParse({
        name: formData.get('name'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        items: itemsRaw,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Datos inválidos. Por favor revise el formulario.',
        };
    }

    const { name, startDate, endDate, items } = validatedFields.data;

    try {
        await prisma.menuService.create({
            data: {
                name,
                startDate,
                endDate,
                items: {
                    create: items?.map((item) => ({
                        recipeId: item.recipeId,
                        estimatedPax: item.estimatedPax,
                    })),
                },
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error al crear el servicio de menú.' };
    }

    revalidatePath('/dashboard/menu-planning');
    redirect('/dashboard/menu-planning');
}

export async function updateMenuService(id: string, prevState: MenuServiceFormState, formData: FormData) {
    const itemsJson = formData.get('items') as string;
    const itemsRaw = itemsJson ? JSON.parse(itemsJson) : [];

    const validatedFields = CreateMenuServiceSchema.safeParse({
        name: formData.get('name'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        items: itemsRaw,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Datos inválidos. Por favor revise el formulario.',
        };
    }

    const { name, startDate, endDate, items } = validatedFields.data;

    try {
        await prisma.menuService.update({
            where: { id },
            data: {
                name,
                startDate,
                endDate,
                items: {
                    deleteMany: {},
                    create: items?.map((item) => ({
                        recipeId: item.recipeId,
                        estimatedPax: item.estimatedPax,
                    })),
                },
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error al actualizar el servicio de menú.' };
    }

    revalidatePath('/dashboard/menu-planning');
    redirect('/dashboard/menu-planning');
}

export async function deleteMenuService(id: string) {
    try {
        await prisma.menuService.delete({
            where: { id },
        });
        revalidatePath('/dashboard/menu-planning');
        return { message: 'Servicio eliminado.' };
    } catch (error) {
        return { message: 'Error al eliminar el servicio.' };
    }
}
