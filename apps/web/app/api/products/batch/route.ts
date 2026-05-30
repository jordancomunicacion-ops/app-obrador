
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { scopedLocationId } from '@/lib/auth/scope';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Asigna el local activo a los ingredientes importados (aislamiento por local).
        const locationId = await scopedLocationId();

        // Process each item to match schema
        // Note: We might want to use createMany if we don't have complex relations, 
        // but SQLite has limits on variables in a single query.
        // Also, we need to handle "PurchaseFormat" creation potentially? 
        // For now, we only create the base Ingredient.

        const createdCount = await prisma.$transaction(async (tx) => {
            let count = 0;
            for (const item of body) {
                if (!item.name || !item.pricePerUnit) continue;

                await tx.ingredient.create({
                    data: {
                        locationId,
                        name: item.name,
                        category: item.category || 'Otros',
                        pricingUnit: item.pricingUnit || 'KG',
                        pricePerUnit: item.pricePerUnit,
                        yieldPercent: item.yieldPercent || 100,
                        allergensJson: item.allergens ? JSON.stringify(item.allergens) : null,
                    }
                });
                count++;
            }
            return count;
        });

        return NextResponse.json({ success: true, count: createdCount });

    } catch (error) {
        console.error('Batch upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
