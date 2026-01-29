'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Config & Validation
const CreateCategory = z.object({
    name: z.string().min(1, 'El nombre es obligatorio').max(50),
});

export type CategoryFormState = {
    errors?: {
        name?: string[];
    };
    message?: string | null;
};

// --- Actions ---

export async function createCategory(prevState: CategoryFormState, formData: FormData) {
    const validatedFields = CreateCategory.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios.',
        };
    }

    const { name } = validatedFields.data;

    try {
        await prisma.recipeCategory.create({
            data: { name },
        });
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/recipes/create');
        revalidatePath('/dashboard/recipes/[id]/edit');
        return { message: 'Categoría creada con éxito.' };
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo crear la categoría.',
        };
    }
}

export async function deleteCategory(id: string) {
    try {
        await prisma.recipeCategory.delete({
            where: { id },
        });
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/recipes/create');
    } catch (error) {
        console.error('Failed to delete category:', error);
        throw new Error('Failed to delete category.');
    }
}

export async function fetchCategories() {
    try {
        const categories = await prisma.recipeCategory.findMany({
            orderBy: { name: 'asc' },
        });
        return categories;
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        throw new Error('Failed to fetch categories.');
    }
}


// --- Packaging Actions ---

const CreatePackaging = z.object({
    name: z.string().min(1, 'El nombre es obligatorio').max(50),
    type: z.enum(['ENVASE', 'MOLDE']).default('ENVASE'),
});

export async function createPackaging(prevState: CategoryFormState, formData: FormData) {
    const validatedFields = CreatePackaging.safeParse({
        name: formData.get('name'),
        type: formData.get('type'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios.',
        };
    }

    const { name, type } = validatedFields.data;

    try {
        await prisma.recipePackaging.create({
            data: { name, type },
        });
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/recipes/create');
        revalidatePath('/dashboard/recipes/[id]/edit');
        return { message: 'Envase creado con éxito.' };
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo crear el envase.',
        };
    }
}

export async function deletePackaging(id: string) {
    try {
        await prisma.recipePackaging.delete({
            where: { id },
        });
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/recipes/create');
        return { message: 'Envase eliminado.' };
    } catch (error) {
        console.error('Failed to delete packaging:', error);
        throw new Error('Failed to delete packaging.');
    }
}

export async function fetchPackaging() {
    try {
        const packaging = await prisma.recipePackaging.findMany({
            orderBy: { name: 'asc' },
        });
        return packaging;
    } catch (error) {
        console.error('Failed to fetch packaging:', error);
        throw new Error('Failed to fetch packaging.');
    }
}

// --- Image Upload Actions ---

import { auth } from '@/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function updateProfileImage(formData: FormData): Promise<{ success?: boolean; imageUrl?: string; error?: string }> {
    try {
        const session = await auth();
        const userId = session?.user?.id || session?.user?.email;

        if (!userId) {
            return { error: 'No autenticado' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { error: 'No se seleccionó ningún archivo' };
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return { error: 'El archivo debe ser una imagen' };
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const ext = path.extname(file.name);
        const safeUserId = String(userId).replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${safeUserId}_${Date.now()}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Convert File to Buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Update user in database
        const imageUrl = `/uploads/profiles/${filename}`;

        // Find user by id or email
        const user = await prisma.user.findFirst({
            where: session?.user?.id ? { id: session.user.id } : { email: session?.user?.email as string }
        });

        if (!user) {
            return { error: 'Usuario no encontrado' };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { image: imageUrl },
        });

        revalidatePath('/dashboard/profile');
        return { success: true, imageUrl };
    } catch (error) {
        console.error('Error uploading profile image:', error);
        return { error: `Error al subir la imagen: ${error instanceof Error ? error.message : 'Desconocido'}` };
    }
}

export async function updateAppLogo(formData: FormData): Promise<{ success?: boolean; imageUrl?: string; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.role || session.user.role !== 'ADMIN') {
            return { error: 'Solo administradores pueden cambiar el logo' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { error: 'No se seleccionó ningún archivo' };
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return { error: 'El archivo debe ser una imagen' };
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'app');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `logo_${Date.now()}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Convert File to Buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Update AppConfig in database
        const imageUrl = `/uploads/app/${filename}`;
        await prisma.appConfig.upsert({
            where: { id: 'default' },
            update: { logoUrl: imageUrl },
            create: { id: 'default', logoUrl: imageUrl },
        });

        revalidatePath('/dashboard/profile');
        revalidatePath('/login');
        return { success: true, imageUrl };
    } catch (error) {
        console.error('Error uploading app logo:', error);
        return { error: 'Error al subir el logo' };
    }
}

