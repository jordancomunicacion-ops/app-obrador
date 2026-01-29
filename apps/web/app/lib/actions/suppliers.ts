'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const SupplierSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
    contactInfo: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
});

const CreateSupplier = SupplierSchema.omit({ id: true });
const UpdateSupplier = SupplierSchema;

export type SupplierFormState = {
    errors?: {
        name?: string[];
        contactInfo?: string[];
        email?: string[];
    };
    message?: string | null;
};

export async function createSupplier(prevState: SupplierFormState, formData: FormData) {
    const validatedFields = CreateSupplier.safeParse({
        name: formData.get('name'),
        contactInfo: formData.get('contactInfo'),
        email: formData.get('email'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios. Error al crear proveedor.',
        };
    }

    const { name, contactInfo, email } = validatedFields.data;

    try {
        await prisma.supplier.create({
            data: {
                name,
                contactInfo,
                email,
            },
        });
    } catch (error) {
        return {
            message: 'Error de base de datos: No se pudo crear el proveedor.',
        };
    }

    revalidatePath('/dashboard/settings');
    return { message: 'Proveedor creado correctamente.' };
}

export async function updateSupplier(id: string, prevState: SupplierFormState, formData: FormData) {
    const validatedFields = UpdateSupplier.safeParse({
        id: id,
        name: formData.get('name'),
        contactInfo: formData.get('contactInfo'),
        email: formData.get('email'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios. Error al actualizar proveedor.',
        };
    }

    const { name, contactInfo, email } = validatedFields.data;

    try {
        await prisma.supplier.update({
            where: { id },
            data: {
                name,
                contactInfo,
                email,
            },
        });
    } catch (error) {
        return {
            message: 'Error de base de datos: No se pudo actualizar el proveedor.',
        };
    }

    revalidatePath('/dashboard/settings');
    return { message: 'Proveedor actualizado correctamente.' };
}

export async function deleteSupplier(id: string) {
    try {
        await prisma.supplier.delete({
            where: { id },
        });
        revalidatePath('/dashboard/settings');
    } catch (error) {
        return { message: 'Error de base de datos: No se pudo borrar el proveedor.' };
    }
}
