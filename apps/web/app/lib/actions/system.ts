'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function toggleApproval(userId: string, currentStatus: boolean) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { approved: !currentStatus },
        });
        revalidatePath('/dashboard/system/users');
    } catch (error) {
        console.error('Failed to toggle approval:', error);
        throw new Error('Failed to toggle approval.');
    }
}

export async function resetPassword(userId: string) {
    try {
        // Default temporary password
        const hashedPassword = await bcrypt.hash('SotoTemporal2024!', 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        revalidatePath('/dashboard/system/users');
    } catch (error) {
        console.error('Failed to reset password:', error);
        throw new Error('Failed to reset password.');
    }
}

export async function makeAdmin(userId: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'ADMIN' },
        });
        revalidatePath('/dashboard/system/users');
    } catch (error) {
        console.error('Failed to promote to admin:', error);
        throw new Error('Failed to promote to admin.');
    }
}
