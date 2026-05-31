'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateUserSchema, UpdateUserSchema, UserFormState } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';

export async function createUser(prevState: UserFormState, formData: FormData) {
    const session = await auth();
    // Only admins or authorized users should create employees
    if (!session?.user?.id) {
        return {
            message: 'No autorizado: Debes iniciar sesión.',
        };
    }

    const validatedFields = CreateUserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dni: formData.get('dni'),
        phone: formData.get('phone'),
        jobTitle: formData.get('jobTitle'),
        dob: formData.get('dob'),
        permissions: formData.getAll('permissions'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios o datos inválidos.',
        };
    }

    const { name, email, password, role, firstName, lastName, dni, phone, jobTitle, dob, permissions } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine adminId. If I am Admin, I am the admin.
    // If I am a Worker (with permission?), my admin is my admin.
    // For now, assume creator is Admin.
    const adminId = session.user.role === 'ADMIN' ? session.user.id : (session.user as any).adminId;

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                firstName,
                lastName,
                dni,
                phone,
                jobTitle,
                dob: dob ? new Date(dob) : undefined,
                permissions,
                adminId: adminId, // Link to Admin
                approved: true, // Workers created by admin are auto-approved
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo crear el usuario. El email podría estar duplicado.',
        };
    }

    revalidatePath('/dashboard/employees');
    redirect('/dashboard/employees');
}

export async function updateUser(
    id: string,
    prevState: UserFormState,
    formData: FormData,
) {
    const validatedFields = UpdateUserSchema.safeParse({
        id: id,
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password') || undefined,
        role: formData.get('role'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dni: formData.get('dni'),
        phone: formData.get('phone'),
        jobTitle: formData.get('jobTitle'),
        dob: formData.get('dob'),
        permissions: formData.getAll('permissions'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios.',
        };
    }

    const { name, email, password, role, firstName, lastName, dni, phone, jobTitle, dob, permissions } = validatedFields.data;

    const dataToUpdate: any = {
        name,
        email,
        role,
        firstName,
        lastName,
        dni,
        phone,
        jobTitle,
        dob: dob ? new Date(dob) : null,
        permissions,
    };

    if (password && password.trim() !== '') {
        dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    try {
        await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo actualizar el usuario.',
        };
    }

    revalidatePath('/dashboard/employees');
    redirect('/dashboard/employees');
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({
            where: { id },
        });
        revalidatePath('/dashboard/employees');
        return { message: 'Usuario eliminado.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error de base de datos: No se pudo eliminar el usuario.' };
    }
}

export async function demoteUser(id: string) {
    try {
        await prisma.user.update({
            where: { id },
            data: { role: 'CHEF' },
        });
        revalidatePath('/dashboard/employees');
        return { message: 'Degraded to Chef' };
    } catch (error) {
        return { message: 'Database Error: Failed to Demote User.' };
    }
}

export async function recoverOrphanUsers() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { message: 'Unauthorized' };

    try {
        const result = await prisma.user.updateMany({
            where: {
                role: 'ADMIN',
                adminId: null,
                id: { not: userId }
            },
            data: {
                adminId: userId,
                role: 'CHEF'
            }
        });

        revalidatePath('/dashboard/employees');
        return { message: `Recuperados ${result.count} usuarios. Ahora aparecen en tu Equipo.` };
    } catch (error) {
        return { message: 'Database Error: Failed to Recover Users.' };
    }
}
