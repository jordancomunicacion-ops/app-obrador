'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateTaskSchema, UpdateTaskSchema, TaskFormState } from '@/app/lib/definitions';

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
