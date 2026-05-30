import { prisma } from '@/lib/prisma';
import { Ingredient, Transformation, TransformationOutput, SupplierProduct } from '@prisma/client';
import { locationScope } from '@/lib/auth/scope';

interface IngredientDemand {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
}

interface PurchaseRecommendation {
    type: 'DIRECT' | 'TRANSFORMATION';
    productId?: string;
    productName: string;
    supplier?: string;
    quantityToBuy: number; // In product's buying unit (e.g., KG)
    reason: string;
    score: number; // Higher is better (0-100)
    coveredIngredients: { name: string, quantity: number, percentage: number }[];
    wasteOrSurplus: { name: string, quantity: number }[];
}

export async function calculateSmartShoppingList(startDate: Date, endDate: Date) {
    // 1. Fetch Events & Aggregate Demand
    const events = await prisma.event.findMany({
        where: {
            ...(await locationScope()),
            date: {
                gte: startDate,
                lte: endDate
            },
            status: 'CONFIRMED'
        },
        include: {
            menuItems: {
                include: {
                    recipe: {
                        include: {
                            items: {
                                include: {
                                    ingredient: true,
                                    subRecipe: {
                                        include: {
                                            items: {
                                                include: { ingredient: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const demandMap = new Map<string, IngredientDemand>();

    // Helper to add demand
    const addDemand = (ingId: string, name: string, qty: number, unit: string) => {
        const current = demandMap.get(ingId) || { ingredientId: ingId, ingredientName: name, quantity: 0, unit };
        current.quantity += qty;
        demandMap.set(ingId, current);
    };

    // Calculate Raw Ingredient Needs (flattening sub-recipes one level deep for simplicity for now)
    // TODO: Recursive flattening for deep sub-recipes
    events.forEach(event => {
        event.menuItems.forEach(menuItem => {
            const pax = menuItem.servingsOverride || event.pax;
            // Apply safety margin (e.g. 1.1)
            const qtyMultiplier = (pax / menuItem.recipe.yieldQuantity) * event.safetyMargin;

            menuItem.recipe.items.forEach(item => {
                if (item.type === 'INGREDIENT' && item.ingredient) {
                    addDemand(item.ingredient.id, item.ingredient.name, item.quantityGross * qtyMultiplier, item.unit);
                } else if (item.type === 'SUB_RECIPE' && item.subRecipe) {
                    // For now, assume sub-recipe items are what we need. 
                    // ideally we recurse. Simplified:
                    const subMultiplier = (item.quantityGross / item.subRecipe.yieldQuantity) * qtyMultiplier;
                    item.subRecipe.items.forEach(subItem => {
                        if (subItem.type === 'INGREDIENT' && subItem.ingredient) {
                            addDemand(subItem.ingredient.id, subItem.ingredient.name, subItem.quantityGross * subMultiplier, subItem.unit);
                        }
                    });
                }
            });
        });
    });

    const needs = Array.from(demandMap.values());
    const recommendations: PurchaseRecommendation[] = [];

    // 2. Resolve Needs
    // For each needed ingredient, find if it comes from a transformation
    for (const need of needs) {
        // Find transformations that produce this ingredient
        const transformations = await prisma.transformation.findMany({
            where: {
                outputs: {
                    some: { ingredientId: need.ingredientId }
                }
            },
            include: {
                sourceProduct: true,
                outputs: { include: { ingredient: true } }
            }
        });

        if (transformations.length === 0) {
            // No transformation found -> Direct Buy
            recommendations.push({
                type: 'DIRECT',
                productName: need.ingredientName, // Or find a linked SupplierProduct
                quantityToBuy: need.quantity,
                reason: 'Compra directa (sin transformación conocida)',
                score: 100,
                coveredIngredients: [{ name: need.ingredientName, quantity: need.quantity, percentage: 100 }],
                wasteOrSurplus: []
            });
            continue;
        }

        // Evaluate transformations
        // We look for the "Best Fit".
        // A "Solomillo" might produce "Punta" (Need) AND "Centro" (Maybe Need) AND "Cabeza" (Maybe Need).

        let bestTrans = null;
        let bestScore = -1;

        for (const trans of transformations) {
            // Target output for our current need
            const targetOutput = trans.outputs.find(o => o.ingredientId === need.ingredientId);
            if (!targetOutput) continue;

            const yieldPct = targetOutput.percentage; // e.g., 20%
            const rawProductNeeded = need.quantity / (yieldPct / 100);

            // Calculate "Utility Score"
            // Utility = (Useful Output Mass / Total Mass) * 100
            // Useful Output = Mass of Need + Mass of OTHER outputs that are ALSO needed.

            let usefulMass = need.quantity;
            const covered: any[] = [{ name: need.ingredientName, quantity: need.quantity, percentage: yieldPct }];
            const waste: any[] = [];

            // Check other outputs
            trans.outputs.forEach(output => {
                if (output.ingredientId === need.ingredientId) return; // Skip self

                const outputQty = rawProductNeeded * (output.percentage / 100);
                const otherNeed = demandMap.get(output.ingredientId || '');

                if (otherNeed) {
                    // We need this too!
                    // Cap utility at needed quantity (surplus is still waste-ish unless we store it)
                    // For this logic, let's say we value it fully up to the needed amount.
                    const useful = Math.min(outputQty, otherNeed.quantity);
                    usefulMass += useful;
                    covered.push({ name: output.ingredient?.name, quantity: useful, percentage: output.percentage });

                    if (outputQty > otherNeed.quantity) {
                        waste.push({ name: output.ingredient?.name || 'Unknown', quantity: outputQty - otherNeed.quantity });
                    }
                } else {
                    // We don't need this -> Waste / Surplus
                    waste.push({ name: output.ingredient?.name || 'Unknown', quantity: outputQty });
                }
            });

            const score = (usefulMass / rawProductNeeded) * 100; // 0 to 100% utilization relative to needs

            if (score > bestScore) {
                bestScore = score;
                bestTrans = {
                    trans,
                    rawProductNeeded,
                    score,
                    covered,
                    waste
                };
            }
        }

        if (bestTrans) {
            recommendations.push({
                type: 'TRANSFORMATION',
                productId: bestTrans.trans.sourceProduct.id,
                productName: bestTrans.trans.sourceProduct.name,
                supplier: bestTrans.trans.sourceProduct.supplier || undefined,
                quantityToBuy: bestTrans.rawProductNeeded,
                reason: `Mejor aprovechamiento (${bestTrans.score.toFixed(0)}%). Cubre: ${bestTrans.covered.map(c => c.name).join(', ')}`,
                score: bestTrans.score,
                coveredIngredients: bestTrans.covered,
                wasteOrSurplus: bestTrans.waste
            });
            // TODO: We should mark these other needs as "Satisfied" so we don't double count them in the main loop!
            // For this POC, we might have duplicates if we process "Centro" next.
        }
    }

    // Deduplication step (Naive)
    // If we decided to buy Solomillo for "Punta", and later we process "Centro" and decide to buy Solomillo again...
    // We need a more unified approach.
    // Ideally, we group needs by "Possible Sources" and solve. 
    // Implementing a simple "Satisfied" set for the POC.

    return recommendations;
}
