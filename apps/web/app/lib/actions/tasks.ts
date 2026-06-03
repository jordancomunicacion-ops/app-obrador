'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateTaskSchema, UpdateTaskSchema, TaskFormState } from '@/app/lib/definitions';
import { scopedLocationId } from '@/app/lib/auth/scope';
import { auth, currentOrgId } from '@/auth';

export async function createTask(prevState: TaskFormState, formData: FormData) {
    const validatedFields = CreateTaskSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
        assignedToUserId: formData.get('assignedToUserId') || null,
        recipeId: formData.get('recipeId') || null,
        targetQuantity: formData.get('targetQuantity'),
        plannedStart: formData.get('plannedStart') || null,
        plannedEnd: formData.get('plannedEnd') || null,
    });

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios o datos inválidos.',
        };
    }

    const { title, description, assignedToUserId, recipeId, targetQuantity, plannedStart, plannedEnd } = validatedFields.data;

    try {
        await prisma.task.create({
            data: {
                locationId: await scopedLocationId(),
                title,
                description,
                assignedToUserId,
                recipeId,
                targetQuantity,
                plannedStart: plannedStart ? new Date(plannedStart) : null,
                plannedEnd: plannedEnd ? new Date(plannedEnd) : null,
                status: 'PENDING'
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo crear la tarea.',
        };
    }

    revalidatePath('/dashboard/tasks');
    redirect('/dashboard/tasks');
}

export async function updateTaskStatus(id: string, status: string, _formData?: FormData) {
    try {
        const data: any = {
            status,
            issueReason: null // Clear reason when moving out of ISSUE or just normal status update
        };

        if (status === 'IN_PROGRESS') {
            data.realStart = new Date();
        } else if (status === 'DONE') {
            data.realEnd = new Date();
        }

        await prisma.task.update({
            where: { id },
            data,
        });
        revalidatePath('/dashboard/tasks');
    } catch (error) {
        console.error('Failed to update task status:', error);
    }
}

export async function reportTaskIssue(id: string, reason: string) {
    try {
        await prisma.task.update({
            where: { id },
            data: {
                status: 'ISSUE',
                issueReason: reason
            } as any,
        });
        revalidatePath('/dashboard/tasks');
    } catch (error) {
        console.error('Failed to report task issue:', error);
    }
}

export async function assignAndStartTask(taskId: string, userId: string, plannedStart: Date, plannedEnd: Date) {
    try {
        await prisma.task.update({
            where: { id: taskId },
            data: {
                assignedToUserId: userId,
                plannedStart: plannedStart,
                plannedEnd: plannedEnd,
                status: 'IN_PROGRESS'
            }
        });
        revalidatePath('/dashboard/tasks');
        return { success: true };
    } catch (error) {
        console.error('Failed to assign and start task:', error);
        return { success: false, message: 'Failed to assign task' };
    }
}

/**
 * Reordena manualmente las tareas del propio empleado en su vista del día.
 * El orden recibido (orderedIds) se persiste en `sortOrder`, que manda sobre la hora.
 * Solo afecta a tareas asignadas al usuario actual y de su organización.
 */
export async function reorderMyTasks(orderedIds: string[]) {
    const session = await auth();
    const userId = session?.user?.id;
    const orgId = await currentOrgId();
    if (!userId || !orgId) return { success: false, message: 'No autenticado' };

    try {
        await prisma.$transaction(
            orderedIds.map((id, idx) =>
                prisma.task.updateMany({
                    where: { id, assignedToUserId: userId, businessId: orgId },
                    data: { sortOrder: idx },
                }),
            ),
        );
        revalidatePath('/dashboard/today');
        return { success: true };
    } catch (error) {
        console.error('Failed to reorder tasks:', error);
        return { success: false, message: 'No se pudo reordenar' };
    }
}

export async function assignTask(taskId: string, userId: string, plannedStart: Date, plannedEnd: Date) {
    try {
        await prisma.task.update({
            where: { id: taskId },
            data: {
                assignedToUserId: userId,
                plannedStart: plannedStart,
                plannedEnd: plannedEnd,
                status: 'PENDING', // Always reset to PENDING when (re)assigning
                issueReason: null // Clear any issue reason
            } as any
        });
        revalidatePath('/dashboard/tasks');
        return { success: true };
    } catch (error) {
        console.error('Failed to assign task:', error);
        return { success: false, message: 'Failed to assign task' };
    }
}
