'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { MiseItem, Shelf } from '@prisma/client';

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
                    items: true
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
                include: { items: true }
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

// --- MISE ITEM ACTIONS ---

export async function addMiseItem(formData: FormData) {
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const volume = parseFloat(formData.get('volume') as string);
    const serviceRhythm = formData.get('serviceRhythm') as string || 'medio';

    // Find a shelf to attach to (temporarily attach to first, or leave null)
    // Actually we link items via Shelf, but items usually start "unassigned" until arranged?
    // Or we just add them to the pool.
    // We need the timbreId context? 
    // Ideally items belong to a Timbre? No, items belong to a Shelf, or are loose. 
    // In our schema: Item -> Shelf (Nullable).
    // So we just create it unassigned.

    await prisma.miseItem.create({
        data: {
            name,
            category,
            volume,
            serviceRhythm,
        }
    });

    revalidatePath('/dashboard/mise-en-place');
}

export async function deleteMiseItem(id: string) {
    await prisma.miseItem.delete({ where: { id } });
    revalidatePath('/dashboard/mise-en-place');
}

// --- AUTO ARRANGE LOGIC ---

export async function autoArrangeItems() {
    const timbre = await getTimbre(); // Get the main timbre
    const items = await prisma.miseItem.findMany(); // Get all items

    // Reset all items first
    // Transaction?

    const updates = [];

    // Helpers
    const getBestGN = (vol: number, cat: string) => {
        // Simple logic based on volume
        if (vol <= 1.0) return '1/9'; // 1L
        if (vol <= 1.6) return '1/6'; // 1.6L
        if (vol <= 2.5) return '1/4'; // 2.5L
        if (vol <= 4.0) return '1/3'; // 4L
        if (vol <= 6.5) return '1/2'; // 6.5L
        if (vol <= 9.0) return '2/3'; // 9L
        return '1/1'; // > 9L
    };

    const getBestDepth = (vol: number, rhythm: string) => {
        if (rhythm === 'alto' && vol < 5) return 65; // Shallower for speed
        if (rhythm === 'bajo') return 150; // Deeper for storage
        return 100; // Standard
    };

    // Sort items: Priority categories first
    // Custom sort order
    const catOrder: Record<string, number> = { 'topping': 1, 'garnish': 2, 'medium': 3, 'large': 4, 'production': 5 };
    items.sort((a, b) => (catOrder[a.category] || 99) - (catOrder[b.category] || 99));

    // Shelves sorting: Top to bottom? Or by height?
    // Usually eye-level (top) is best for high rhythm?
    // Let's iterate shelves top-down.

    for (const item of items) {
        const bestGN = getBestGN(item.volume, item.category);
        const bestDepth = getBestDepth(item.volume, item.serviceRhythm);

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
        await prisma.miseItem.update({
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
