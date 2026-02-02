'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo: '/dashboard',
        });
    } catch (error) {
        // Handle Next.js Redirect
        if ((error as Error).message === 'NEXT_REDIRECT') {
            throw error;
        }

        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                case 'CallbackRouteError':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }
        console.error('Auth Error:', error);
        return 'Algo salió mal.';
    }
}

export async function signOutAction() {
    await signOut({ redirectTo: '/login' });
}

// --- REGISTRATION ---
import { CreateUserSchema, UserFormState } from './definitions';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function registerUser(prevState: UserFormState | undefined, formData: FormData): Promise<UserFormState> {
    const validatedFields = CreateUserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: 'ADMIN', // New registrations are Tenants (Admins)
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios. Error al registrar usuario.',
        };
    }

    const { name, email, password } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const isMasterAdmin = email === 'gerencia@sotodelprior.com';

    // Default permissions for a new Tenant (Everything)
    const defaultPermissions = [
        'dashboard', 'events', 'tasks', 'menu-planning',
        'products', 'recipes', 'purchasing', 'storage',
        'mise-en-place', 'employees', 'settings'
    ];

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'ADMIN',
                approved: isMasterAdmin, // Require manual approval for new Tenants
                permissions: defaultPermissions,
                // adminId is null for Tenants (they are the root)
            },
        });
    } catch (error) {
        console.error('Prisma Register Error:', error);

        // Check for unique constraint violation (P2002)
        // @ts-ignore
        if (error.code === 'P2002') {
            return {
                message: 'El email ya está uso.',
            };
        }

        // Return technical message if available for debugging
        return {
            message: `Error de base de datos: ${(error as any).message || 'Error al registrar usuario.'}`,
        };
    }

    redirect('/login');
}
