'use server';

import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Lists all users. Only allowed for ADMINs.
 */
export async function getUsers() {
    const session = await auth();

    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only administrators can list users.');
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Could not fetch users.');
    }
}

/**
 * Updates the approval status of a user.
 */
export async function updateUserStatus(userId: string, approved: boolean) {
    const session = await auth();

    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only administrators can approve users.');
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { approved },
        });
        revalidatePath('/dashboard/employees');
        return { success: true };
    } catch (error) {
        console.error('Error updating user status:', error);
        return { success: false, message: 'Could not update user status.' };
    }
}
