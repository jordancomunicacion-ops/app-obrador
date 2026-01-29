'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateEventSchema, UpdateEventSchema, EventFormState } from '@/app/lib/definitions';

// --- EVENTS ---

export async function createEvent(prevState: EventFormState, formData: FormData) {
    const menuItemsJson = formData.get('menuItems') as string;
    const menuItemsRaw = menuItemsJson ? JSON.parse(menuItemsJson) : [];

    const validatedFields = CreateEventSchema.safeParse({
        name: formData.get('name'),
        date: formData.get('date'),
        pax: formData.get('pax'),
        safetyMargin: formData.get('safetyMargin'),
        status: formData.get('status'),
        menuItems: menuItemsRaw,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios o datos inválidos.',
        };
    }

    const { name, date, pax, safetyMargin, status, menuItems } = validatedFields.data;

    try {
        await prisma.event.create({
            data: {
                name,
                date,
                pax,
                safetyMargin,
                status: status || 'DRAFT',
                menuItems: {
                    create: menuItems?.map(item => ({
                        recipeId: item.recipeId,
                        servingsOverride: item.servingsOverride || null
                    }))
                }
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo crear el evento.',
        };
    }

    revalidatePath('/dashboard/events');
    redirect('/dashboard/events');
}

export async function updateEvent(
    id: string,
    prevState: EventFormState,
    formData: FormData,
) {
    const menuItemsJson = formData.get('menuItems') as string;
    const menuItemsRaw = menuItemsJson ? JSON.parse(menuItemsJson) : [];

    const validatedFields = UpdateEventSchema.safeParse({
        id: id,
        name: formData.get('name'),
        date: formData.get('date'),
        pax: formData.get('pax'),
        safetyMargin: formData.get('safetyMargin'),
        status: formData.get('status'),
        menuItems: menuItemsRaw,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios.',
        };
    }

    const { name, date, pax, safetyMargin, status, menuItems } = validatedFields.data;

    try {
        await prisma.$transaction(async (tx) => {
            // Update basic info
            await tx.event.update({
                where: { id },
                data: {
                    name,
                    date,
                    pax,
                    safetyMargin,
                    status,
                }
            });

            // Sync for Menu Items: Delete all and Re-create (Simplified sync)
            await tx.eventMenuItem.deleteMany({
                where: { eventId: id }
            });

            if (menuItems && menuItems.length > 0) {
                await tx.eventMenuItem.createMany({
                    data: menuItems.map(item => ({
                        eventId: id,
                        recipeId: item.recipeId,
                        servingsOverride: item.servingsOverride || null
                    }))
                });
            }
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo actualizar el evento.',
        };
    }

    revalidatePath('/dashboard/events');
    redirect('/dashboard/events');
}

export async function deleteEvent(id: string) {
    try {
        await prisma.event.delete({
            where: { id },
        });
        revalidatePath('/dashboard/events');
        return { message: 'Evento eliminado.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error de base de datos: No se pudo eliminar el evento.' };
    }
}


// --- TASK GENERATION ---

export async function generateTasksForEvent(eventId: string) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                menuItems: {
                    include: {
                        recipe: true
                    }
                }
            }
        });

        if (!event) throw new Error('Event not found');

        const tasksCreated = [];

        for (const item of event.menuItems) {
            const targetQty = item.servingsOverride || event.pax;
            const recipeName = item.recipe.name;

            // Check if task already exists for this recipe in this event context
            // Since there is no direct link Event->Task in schema, we check title pattern or we add a link if needed.
            // For now, simpler approach: Create a task.

            const taskTitle = `PROD: ${recipeName} (${targetQty} pax)`;

            const task = await prisma.task.create({
                data: {
                    title: taskTitle,
                    description: `Generado desde Evento: ${event.name}`,
                    status: 'PENDING',
                    recipeId: item.recipeId,
                    targetQuantity: targetQty,
                    plannedEnd: event.date, // Due date is event date
                }
            });
            tasksCreated.push(task);
        }

        revalidatePath(`/dashboard/events/${eventId}`);
        revalidatePath('/dashboard/tasks');
        return { message: `${tasksCreated.length} tareas generadas correctamente.` };

    } catch (error) {
        console.error('Generation Error:', error);
        return { message: 'Error al generar tareas.' };
    }
}
