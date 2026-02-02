'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Partition, Shelf } from '@prisma/client';

// --- TYPES ---
export type TimbreState = {
    message?: string;
    errors?: Record<string, string[]>;
};

// --- TIMBRE ACTIONS ---

export async function getTimbre() {
    // For now, we assume a single/default timbre for simplicity, or get the first one
    const timbre = await prisma.timbre.findFirst({
        include: {
            shelves: {
                orderBy: { position: 'asc' },
                include: {
                    partitions: true
                }
            }
        }
    });

    if (!timbre) {
        // Create default if not exists
        return await createDefaultTimbre();
    }

    return timbre;
}

async function createDefaultTimbre() {
    return await prisma.timbre.create({
        data: {
            name: 'Timbre Principal',
            shelves: {
                create: [
                    { position: 1, height: 150 },
                    { position: 2, height: 150 },
                    { position: 3, height: 150 },
                    { position: 4, height: 150 },
                ]
            }
        },
        include: {
            shelves: {
                orderBy: { position: 'asc' },
                include: { partitions: true }
            }
        }
    });
}

export async function updateShelfHeight(shelfId: string, height: number) {
    await prisma.shelf.update({
        where: { id: shelfId },
        data: { height }
    });
    revalidatePath('/dashboard/mise-en-place');
}

export async function addShelf(timbreId: string) {
    const count = await prisma.shelf.count({ where: { timbreId } });
    await prisma.shelf.create({
        data: {
            timbreId,
            position: count + 1,
            height: 150
        }
    });
    revalidatePath('/dashboard/mise-en-place');
}

export async function removeShelf(shelfId: string) {
    await prisma.shelf.delete({ where: { id: shelfId } });
    revalidatePath('/dashboard/mise-en-place');
}

// --- PARTITION ACTIONS ---

export async function addMiseItem(formData: FormData) {
    const name = formData.get('name') as string;
    const type = formData.get('category') as string;
    const volume = parseFloat(formData.get('volume') as string);
    const serviceRhythm = formData.get('serviceRhythm') as string || 'medio';

    // Map volume float to volumeLevel string
    let volumeLevel = 'medio';
    if (volume < 2) volumeLevel = 'bajo';
    else if (volume > 5) volumeLevel = 'alto';

    await prisma.partition.create({
        data: {
            name,
            type,
            volumeLevel,
            serviceRhythm,
        }
    });

    revalidatePath('/dashboard/mise-en-place');
}

export async function deleteMiseItem(id: string) {
    await prisma.partition.delete({ where: { id } });
    revalidatePath('/dashboard/mise-en-place');
}

// --- AUTO ARRANGE LOGIC ---

export async function autoArrangeItems() {
    const timbre = await getTimbre(); // Get the main timbre
    const items = await prisma.partition.findMany(); // Get all partitions

    // Reset all items first
    // Transaction?

    const updates = [];

    // Helpers
    const getBestGN = (volLevel: string, type: string) => {
        // Mapping volumeLevel to approximate liters for the old logic
        const volumeMap: Record<string, number> = { 'bajo': 1.5, 'medio': 3.5, 'alto': 7.0 };
        const vol = volumeMap[volLevel] || 3.5;

        // Simple logic based on volume
        if (vol <= 1.0) return '1/9'; // 1L
        if (vol <= 1.6) return '1/6'; // 1.6L
        if (vol <= 2.5) return '1/4'; // 2.5L
        if (vol <= 4.0) return '1/3'; // 4L
        if (vol <= 6.5) return '1/2'; // 6.5L
        if (vol <= 9.0) return '2/3'; // 9L
        return '1/1'; // > 9L
    };

    const getBestDepth = (volLevel: string, rhythm: string) => {
        if (rhythm === 'alto' && volLevel !== 'alto') return 65; // Shallower for speed
        if (rhythm === 'bajo') return 150; // Deeper for storage
        return 100; // Standard
    };

    // Sort items: Priority types first
    const catOrder: Record<string, number> = { 'topping': 1, 'garnish': 2, 'medium': 3, 'large': 4, 'production': 5 };
    items.sort((a, b) => (catOrder[a.type] || 99) - (catOrder[b.type] || 99));

    // Shelves sorting: Top to bottom? Or by height?
    // Usually eye-level (top) is best for high rhythm?
    // Let's iterate shelves top-down.

    for (const item of items) {
        const bestGN = getBestGN(item.volumeLevel, item.type);
        const bestDepth = getBestDepth(item.volumeLevel, item.serviceRhythm);

        let assignedShelfId = null;

        // Find fit
        for (const shelf of timbre.shelves) {
            // Check Height
            if (shelf.height >= bestDepth + 25) { // 25mm clearance
                assignedShelfId = shelf.id;
                // TODO: Check width capacity? 
                // For now, we fill shelves sequentially
                break;
            }
        }

        // Update item
        await prisma.partition.update({
            where: { id: item.id },
            data: {
                assignedGN: bestGN,
                assignedDepth: bestDepth,
                shelfId: assignedShelfId
            }
        });
    }

    revalidatePath('/dashboard/mise-en-place');
}
