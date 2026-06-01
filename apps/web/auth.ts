import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { authConfig } from './auth.config';
import { isPlatformOwnerEmail, PLATFORM_ROLE } from '@/app/lib/auth/platform';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    trustHost: true,
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;

                // Fetch fresh permissions and role from database
                // This ensures that if an admin updates permissions, the user sees changes immediately
                // without needing to re-login.
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.sub },
                        select: { permissions: true, role: true }
                    });

                    if (freshUser) {
                        (session.user as any).permissions = freshUser.permissions;
                        session.user.role = freshUser.role;
                    }
                } catch (e) {
                    console.error("Failed to fetch fresh permissions in session", e);
                    // Fallback to token values if DB fails
                    if (token.role) session.user.role = token.role as string;
                    if (token.permissions) (session.user as any).permissions = token.permissions;
                }
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.permissions = (user as any).permissions;
            }
            return token;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    try {
                        const user = await prisma.user.findFirst({
                            where: {
                                email: { equals: email, mode: 'insensitive' }
                            }
                        });
                        if (!user) return null;

                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (!passwordsMatch) return null;

                        // Strict Approval Check
                        // Exception for the platform owner (legacy email or SUPERADMIN role)
                        if (!isPlatformOwnerEmail(email) && user.role !== PLATFORM_ROLE && !user.approved) {
                            throw new Error('AccessDenied');
                        }

                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            approved: user.approved,
                            permissions: user.permissions,
                        };
                    } catch (error) {
                        return null;
                    }
                }
                return null;
            },
        }),
    ],
});

export async function currentOrgId() {
    // Delega en currentAccountId(): para ADMIN/USER resuelve su organización igual
    // que antes; para el propietario de plataforma (SUPERADMIN) resuelve la CUENTA
    // ACTIVA seleccionada en la barra (o null = "Todas las cuentas"). Así los ~41
    // consumidores de currentOrgId() honran el selector de cuenta sin cambios.
    //
    // Import dinámico para romper el ciclo de módulos: account.ts importa `auth`
    // de este fichero.
    try {
        const { currentAccountId } = await import('@/app/lib/auth/account');
        return await currentAccountId();
    } catch (e) {
        console.error("Error getting Org ID", e);
        return null;
    }
}
