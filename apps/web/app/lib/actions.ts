'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/app/lib/prisma';

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
import { UserFormState } from './definitions';

export async function registerUser(prevState: UserFormState | undefined, formData: FormData): Promise<UserFormState> {
    // Auto-registro deshabilitado: las cuentas las crea el propietario de
    // plataforma desde /dashboard/settings/empresas (createBusiness) y los
    // accesos individuales desde /dashboard/settings/accesos
    // (updateBusinessAccess). Esta acción queda como no-op por si algún
    // cliente antiguo aún la invoca.
    void prevState;
    void formData;
    return {
        message: 'El registro está deshabilitado. Las cuentas las crea la administración de la plataforma.',
    };
}
