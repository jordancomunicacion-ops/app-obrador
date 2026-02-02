'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

const MASTER_EMAIL = 'gerencia@sotodelprior.com';

async function checkAuth() {
    const session = await auth();
    if (session?.user?.email !== MASTER_EMAIL) {
        throw new Error('Unauthorized');
    }
}

export async function toggleApproval(userId: string, currentStatus: boolean) {
    await checkAuth();
    await prisma.user.update({
        where: { id: userId },
        data: { approved: !currentStatus }
    });
    revalidatePath('/dashboard/system/users');
}

export async function resetPassword(userId: string) {
    await checkAuth();
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
    revalidatePath('/dashboard/system/users');
}

export async function makeAdmin(userId: string) {
    await checkAuth();

    // Default permissions for a new Tenant (Everything)
    const defaultPermissions = [
        'dashboard', 'events', 'tasks', 'menu-planning',
        'products', 'recipes', 'purchasing', 'storage',
        'mise-en-place', 'employees', 'settings'
    ];

    await prisma.user.update({
        where: { id: userId },
        data: {
            role: 'ADMIN',
            adminId: null, // Detach from any other admin
            permissions: defaultPermissions
        }
    });
    revalidatePath('/dashboard/system/users');
}
