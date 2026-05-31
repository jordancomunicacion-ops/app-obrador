'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateEventSchema, UpdateEventSchema, type EventFormState } from '@/app/lib/definitions';
import { syncAggregatedTasks } from '@/app/lib/production';
import { scopedLocationId, locationScope } from '@/app/lib/auth/scope';
export type { EventFormState };

// --- EVENTS ---

export async function createEvent(prevState: EventFormState, formData: FormData) {
    const menuItemsJson = formData.get('menuItems') as string;
    const menuItemsRaw = menuItemsJson ? JSON.parse(menuItemsJson) : [];
    // Filter out items without a recipe selection to avoid validation errors on empty rows
    const menuItemsFiltered = menuItemsRaw.filter((item: any) => item.recipeId && item.recipeId !== '');

    const validatedFields = CreateEventSchema.safeParse({
        name: formData.get('name'),
        date: formData.get('date'),
        pax: formData.get('pax'),
        safetyMargin: formData.get('safetyMargin'),
        status: formData.get('status') || undefined,
        menuItems: menuItemsFiltered,
    });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        return {
            errors,
            message: "Datos inválidos.",
        };
    }

    const { name, date, pax, safetyMargin, status, menuItems } = validatedFields.data;

    try {
        const event = await prisma.event.create({
            data: {
                locationId: await scopedLocationId(),
                name,
                date,
                pax: Math.ceil(pax),
                safetyMargin,
                status: status || 'DRAFT',
                menuItems: {
                    create: menuItems?.map(item => ({
                        recipeId: item.recipeId,
                        servingsOverride: item.servingsOverride ? Math.ceil(item.servingsOverride) : null
                    }))
                }
            },
        });

        // Auto-generate tasks if confirmed
        if (event.status === 'CONFIRMED') {
            await syncAggregatedTasks([event.id]);
        }
    } catch (error: any) {
        console.error('Database Error:', error);
        return { message: "Error al crear evento." };
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
    // Filter out items without a recipe selection
    const menuItemsFiltered = menuItemsRaw.filter((item: any) => item.recipeId && item.recipeId !== '');

    const validatedFields = UpdateEventSchema.safeParse({
        id: id,
        name: formData.get('name'),
        date: formData.get('date'),
        pax: formData.get('pax'),
        safetyMargin: formData.get('safetyMargin'),
        status: formData.get('status') || undefined,
        menuItems: menuItemsFiltered,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: "Datos inválidos." };
    }

    const { name, date, pax, safetyMargin, status, menuItems } = validatedFields.data;

    const inScope = await prisma.event.findFirst({
        where: { ...(await locationScope()), id },
        select: { id: true },
    });
    if (!inScope) {
        return { message: 'No autorizado: el evento no pertenece a tu local.' };
    }

    try {
        const event = await prisma.event.update({
            where: { id },
            data: {
                name,
                date,
                pax: Math.ceil(pax),
                safetyMargin,
                status,
                menuItems: {
                    deleteMany: {},
                    create: menuItems?.map(item => ({
                        recipeId: item.recipeId,
                        servingsOverride: item.servingsOverride ? Math.ceil(item.servingsOverride) : null
                    }))
                }
            }
        });

        // Auto-generate tasks if confirmed
        if (event.status === 'CONFIRMED') {
            await syncAggregatedTasks([event.id]);
        }
    } catch (error: any) {
        console.error('Database Error:', error);
        return { message: "Error al actualizar evento." };
    }

    revalidatePath('/dashboard/events');
    redirect('/dashboard/events');
}

export async function deleteEvent(id: string) {
    try {
        const scoped = await prisma.event.findFirst({
            where: { ...(await locationScope()), id },
            select: { id: true },
        });
        if (!scoped) {
            return { message: 'No autorizado: el evento no pertenece a tu local.' };
        }
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

export async function confirmEvent(id: string) {
    try {
        await prisma.event.update({
            where: { id },
            data: { status: 'CONFIRMED' },
        });

        // Trigger task generation
        await syncAggregatedTasks([id]);

        revalidatePath('/dashboard/events');
        return { message: 'Evento confirmado y tareas generadas.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error al confirmar el evento.' };
    }
}


// --- BULK PRODUCTION ---


export async function generateTasksForEvent(eventId: string) {
    console.log('Server Action generateTasksForEvent called for:', eventId);
    try {
        await syncAggregatedTasks([eventId]);
        revalidatePath('/dashboard/events');
        return { message: 'Tareas generadas correctamente.' };
    } catch (error) {
        console.error('Task Generation Error:', error);
        return { message: 'Error al generar tareas.' };
    }
}

export async function generateAllProductionTasks() {

    try {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const scope = await locationScope();

        // Fetch Confirmed Events for next 7 days
        const events = await prisma.event.findMany({
            where: {
                ...scope,
                status: 'CONFIRMED',
                date: { gte: today, lte: nextWeek }
            },
            select: { id: true }
        });
        const eventIds = events.map(e => e.id);

        // Fetch Menu Services for next 7 days
        const menuServices = await prisma.menuService.findMany({
            where: {
                ...scope,
                startDate: { gte: today, lte: nextWeek }
                // Assuming we want all planned services. Or filter by status 'PLANNED'/'ACTIVE'?
                // For production, PLANNED is good.
            },
            select: { id: true }
        });
        const menuServiceIds = menuServices.map(s => s.id);

        if (eventIds.length === 0 && menuServiceIds.length === 0) return { message: 'No hay eventos ni servicios confirmados para la próxima semana.' };

        await syncAggregatedTasks(eventIds, menuServiceIds);

        revalidatePath('/dashboard/tasks');
        revalidatePath('/dashboard/events');
        revalidatePath('/dashboard/menu-planning');

        return { message: `Producción generada: ${events.length} eventos, ${menuServices.length} servicios.` };
    } catch (error) {
        console.error('Bulk Generation Error:', error);
        return { message: 'Error al generar producción global.' };
    }
}
