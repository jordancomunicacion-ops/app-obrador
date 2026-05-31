'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { generateAllRecommendations } from '../timbre/recommendations';
import { Partition as PartitionType, Shelf as ShelfType, VolumeLevel, ServiceRhythm, PartitionType as PType } from '../timbre/types';

// Fetch the main timbre configuration
export async function getTimbreConfig() {
    return await prisma.timbre.findFirst({
        include: {
            shelves: {
                orderBy: { position: 'asc' },
                include: {
                    partitions: true
                }
            }
        }
    });
}

export async function createPartition(formData: FormData) {
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const volumeLevel = formData.get('volumeLevel') as string;
    const serviceRhythm = formData.get('serviceRhythm') as string;
    const timbreId = formData.get('timbreId') as string;

    if (!name || !type || !volumeLevel || !serviceRhythm || !timbreId) {
        return { message: 'Faltan campos obligatorios' };
    }

    try {
        await prisma.partition.create({
            data: {
                name,
                type,
                volumeLevel,
                serviceRhythm,
                // shelfId is optional
            }
        });

        revalidatePath('/dashboard/mise-en-place/timbre');
        return { message: 'Partida creada' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al crear partida' };
    }
}

export async function deletePartition(id: string) {
    try {
        await prisma.partition.delete({ where: { id } });
        revalidatePath('/dashboard/mise-en-place/timbre');
        return { message: 'Partida eliminada' };
    } catch (e) {
        console.error('Error deleting partition:', e);
        return { message: 'Error al eliminar' };
    }
}

export async function ensureDefaultTimbre() {
    const existing = await prisma.timbre.findFirst({
        include: { shelves: true }
    });
    if (!existing) {
        const timbre = await prisma.timbre.create({
            data: {
                name: 'Timbre Principal',
                shelves: {
                    create: [
                        { position: 1, height: 200 }, // Top shelf
                        { position: 2, height: 150 },
                        { position: 3, height: 150 },
                        { position: 4, height: 250 }, // Bottom/Vegetable drawer
                    ]
                }
            },
            include: { shelves: true }
        });
        return timbre;
    }
    return existing;
}

// Helper to bridge DB data to Algorithm types
export async function getRecommendationsForTimbre() {
    const timbre = await prisma.timbre.findFirst({
        include: {
            shelves: {
                orderBy: { position: 'asc' },
                include: { partitions: true }
            }
        }
    });

    if (!timbre) return [];

    // Map DB Shelves to Algorithm Shelves
    const algShelves: ShelfType[] = timbre.shelves.map(s => ({
        id: s.id,
        availableHeight: s.height,
        containers: []
    }));

    // Fetch all partitions
    const allPartitions = await prisma.partition.findMany();

    const algPartitions: PartitionType[] = allPartitions.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type as PType,
        volumeLevel: p.volumeLevel as VolumeLevel,
        serviceRhythm: p.serviceRhythm as ServiceRhythm
    }));

    // Run Algorithm
    const recommendations = generateAllRecommendations(algPartitions, algShelves);
    return recommendations;
}
