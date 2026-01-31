import { prisma } from '@/lib/prisma';
import { UnitType } from '@/app/lib/units';
import { Ingredient } from '@prisma/client';
import { getRequirementsForEvents, resolveTransformations, Requirement, TransformationResult } from './production';

export type ShoppingListItem = {
    ingredient: Ingredient;
    totalQuantity: number;
    unit: UnitType;
    estimatedCost: number;
    isTransformation?: boolean;
    sourceProduct?: {
        name: string;
        requiredQty: number;
        unit: string;
    };
    byproducts?: {
        name: string;
        quantity: number;
        unit: string;
    }[];
};

export async function generateShoppingList(eventId: string): Promise<ShoppingListItem[]> {
    const requirements = await getRequirementsForEvents([eventId]);
    const { purchases, leftovers } = await resolveTransformations(requirements);

    const list: ShoppingListItem[] = [];

    // Add Resolved Transformations (Purchases of whole pieces)
    for (const p of purchases.values()) {
        const primaryIngredient = await prisma.ingredient.findUnique({ where: { id: p.ingredientId } });
        if (!primaryIngredient) continue;

        // Fetch the source product to get the real buy price
        const sourceProduct = await prisma.supplierProduct.findUnique({
            where: { id: p.sourceProductId }
        });

        const pricePerUnit = sourceProduct?.price || 0;

        list.push({
            ingredient: primaryIngredient,
            totalQuantity: p.targetQty,
            unit: p.sourceUnit,
            estimatedCost: p.requiredSourceQty * pricePerUnit,
            isTransformation: true,
            sourceProduct: {
                name: p.sourceProductName,
                requiredQty: p.requiredSourceQty,
                unit: p.sourceUnit
            },
            byproducts: p.byproducts.map(b => ({
                name: b.name,
                quantity: b.quantity,
                unit: b.unit
            }))
        });
    }

    // Add leftovers (raw purchases)
    for (const l of leftovers) {
        const ingredient = await prisma.ingredient.findUnique({ where: { id: l.ingredientId } });
        if (!ingredient) continue;

        const existing = list.find(i => i.ingredient.id === l.ingredientId);
        if (existing) {
            existing.totalQuantity += l.quantity;
            existing.estimatedCost += l.quantity * (ingredient.pricePerUnit || 0);
        } else {
            list.push({
                ingredient,
                totalQuantity: l.quantity,
                unit: l.unit,
                estimatedCost: l.quantity * (ingredient.pricePerUnit || 0),
                isTransformation: false
            });
        }
    }

    return list;
}
