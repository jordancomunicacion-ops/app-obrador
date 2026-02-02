import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    trustHost: true,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    try {
                        const user = await prisma.user.findUnique({ where: { email } });
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
