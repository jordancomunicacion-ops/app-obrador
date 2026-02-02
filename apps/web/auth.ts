import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

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
                        // Exception for Master Admin
                        if (email !== 'gerencia@sotodelprior.com' && !user.approved) {
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
    const session = await auth();
    if (!session?.user?.id) return null;

    // If I am ADMIN, I am the Org.
    // If I am USER, my admin is the Org.
    // Note: session.user.id is string.
    // We need to fetch the user to get adminId if it's not in session.
    // Actually, let's fetch it to be safe.

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, adminId: true, id: true }
        });

        if (!user) return null;

        if (user.role === 'ADMIN') {
            return user.id;
        } else {
            return user.adminId || null; // Should have adminId if USER
        }
    } catch (e) {
        console.error("Error getting Org ID", e);
        return null;
    }
}
