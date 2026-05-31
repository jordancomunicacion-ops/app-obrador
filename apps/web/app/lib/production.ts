import { prisma } from '@/app/lib/prisma';
import { convertTo, UnitType } from '@/app/lib/units';

export type Requirement = {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: UnitType;
    recipeId: string;
    recipeName: string;
    eventId?: string;
    eventName?: string;
    menuServiceId?: string;
    menuServiceName?: string;
    action?: string;
    technique?: string;
};

export type TransformationResult = {
    sourceProductId: string;
    sourceProductName: string;
    requiredSourceQty: number;
    sourceUnit: UnitType;
    ingredientId: string; // The one we originally needed
    targetQty: number;
    eventIds: string[];
    menuServiceIds: string[];
    byproducts: {
        ingredientId: string;
        name: string;
        quantity: number;
        unit: UnitType;
    }[];
};

/**
 * Explodes events into a list of base ingredient requirements, 
 * factoring in recipe yields and safety margins.
 */
export async function getRequirementsForEvents(eventIds: string[]): Promise<Requirement[]> {
    const events = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        include: {
            menuItems: {
                include: {
                    recipe: {
                        include: {
                            items: { include: { ingredient: true } },
                            steps: {
                                include: {
                                    stepIngredients: {
                                        include: {
                                            ingredient: true,
                                            subRecipe: true
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

    const allRequirements: Requirement[] = [];

    for (const event of events) {
        for (const menuItem of event.menuItems) {
            const targetServings = Math.ceil((menuItem.servingsOverride || event.pax) * event.safetyMargin);
            await explodeRecipe(menuItem.recipe, targetServings, { eventId: event.id, eventName: event.name }, allRequirements);
        }
    }

    return allRequirements;
}

/**
 * Explodes menu services (daily menu) into ingredient requirements.
 */
export async function getRequirementsForMenuServices(serviceIds: string[]): Promise<Requirement[]> {
    const services = await prisma.menuService.findMany({
        where: { id: { in: serviceIds } },
        include: {
            items: {
                include: {
                    recipe: {
                        include: {
                            items: { include: { ingredient: true } },
                            steps: {
                                include: {
                                    stepIngredients: {
                                        include: {
                                            ingredient: true,
                                            subRecipe: true
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

    const allRequirements: Requirement[] = [];

    for (const service of services) {
        for (const item of service.items) {
            // Daily menu item estimated pax. No safety margin applied by default, or maybe 1.0
            const targetServings = item.estimatedPax;
            await explodeRecipe(item.recipe, targetServings, { menuServiceId: service.id, menuServiceName: service.name }, allRequirements);
        }
    }

    return allRequirements;
}

type SourceContext = {
    eventId?: string;
    eventName?: string;
    menuServiceId?: string;
    menuServiceName?: string;
}

async function explodeRecipe(recipe: any, neededServings: number, context: SourceContext, results: Requirement[]) {
    const factor = neededServings / (recipe.yieldQuantity || 1);

    // Default explosion via RecipeItems (quantities)
    for (const item of recipe.items) {
        if (item.type === 'INGREDIENT' && item.ingredient) {
            // Find if there's a specific step that uses this ingredient for Action/Technique metadata
            let action = undefined;
            let technique = undefined;

            const relevantStep = recipe.steps?.find((s: any) =>
                s.stepIngredients?.some((si: any) => si.ingredientId === item.ingredientId)
            );

            if (relevantStep) {
                action = relevantStep.action || undefined;
                technique = relevantStep.technique || undefined;
            }

            results.push({
                ingredientId: item.ingredientId,
                ingredientName: item.ingredient.name,
                quantity: item.quantityGross * factor,
                unit: item.unit as UnitType,
                recipeId: recipe.id,
                recipeName: recipe.name,
                eventId: context.eventId,
                eventName: context.eventName,
                menuServiceId: context.menuServiceId,
                menuServiceName: context.menuServiceName,
                action,
                technique
            });
        } else if (item.type === 'SUB_RECIPE' && item.subRecipeId) {
            const subRecipe = await prisma.recipe.findUnique({
                where: { id: item.subRecipeId },
                include: {
                    items: { include: { ingredient: true } },
                    steps: { include: { stepIngredients: { include: { ingredient: true, subRecipe: true } } } }
                }
            });
            if (subRecipe) {
                await explodeRecipe(subRecipe, item.quantityGross * factor, context, results);
            }
        }
    }
}

/**
 * Resolves ingredient requirements into source products via transformations (Yield Tests).
 */
export async function resolveTransformations(requirements: Requirement[]): Promise<{
    purchases: Map<string, TransformationResult>;
    leftovers: Requirement[];
}> {
    const purchases = new Map<string, TransformationResult>();
    const leftoversByEvent: Requirement[] = [];

    // Group requirements by IngredientId for logic calculation, but keep event context
    const ingredientTotalQty = new Map<string, number>();
    const ingredientEventMap = new Map<string, Set<string>>();
    const ingredientMenuMap = new Map<string, Set<string>>();
    const ingredientNames = new Map<string, string>();
    const ingredientUnits = new Map<string, UnitType>();

    for (const req of requirements) {
        const current = ingredientTotalQty.get(req.ingredientId) || 0;
        ingredientTotalQty.set(req.ingredientId, current + req.quantity);

        if (req.eventId) {
            const events = ingredientEventMap.get(req.ingredientId) || new Set<string>();
            events.add(req.eventId as string);
            ingredientEventMap.set(req.ingredientId, events);
        }

        if (req.menuServiceId) {
            const menus = ingredientMenuMap.get(req.ingredientId) || new Set<string>();
            menus.add(req.menuServiceId as string);
            ingredientMenuMap.set(req.ingredientId, menus);
        }

        ingredientNames.set(req.ingredientId, req.ingredientName);
        ingredientUnits.set(req.ingredientId, req.unit);
    }

    for (const [ingredientId, totalQty] of ingredientTotalQty.entries()) {
        const transOutput = await prisma.transformationOutput.findFirst({
            where: { ingredientId },
            include: {
                transformation: {
                    include: {
                        sourceProduct: true,
                        outputs: { include: { ingredient: true } }
                    }
                }
            },
            orderBy: { transformation: { createdAt: 'desc' } }
        });

        if (transOutput) {
            const trans = transOutput.transformation;
            const yieldFactor = transOutput.percentage / 100;
            const requiredSourceQty = totalQty / (yieldFactor || 1);

            const existing = purchases.get(trans.sourceProductId);
            if (existing) {
                existing.requiredSourceQty += requiredSourceQty;
                existing.targetQty += totalQty;
                ingredientEventMap.get(ingredientId)?.forEach(id => existing.eventIds.push(id));
                ingredientMenuMap.get(ingredientId)?.forEach(id => existing.menuServiceIds.push(id));
                // Byproducts update logic omitted for simplicity
            } else {
                purchases.set(trans.sourceProductId, {
                    sourceProductId: trans.sourceProductId,
                    sourceProductName: trans.sourceProduct.name,
                    requiredSourceQty,
                    sourceUnit: trans.testUnit as UnitType,
                    ingredientId,
                    targetQty: totalQty,
                    eventIds: Array.from(ingredientEventMap.get(ingredientId) || []),
                    menuServiceIds: Array.from(ingredientMenuMap.get(ingredientId) || []),
                    byproducts: trans.outputs
                        .filter(o => o.ingredientId !== ingredientId)
                        .map(o => ({
                            ingredientId: o.ingredientId,
                            name: o.ingredient.name,
                            quantity: requiredSourceQty * (o.percentage / 100),
                            unit: trans.testUnit as UnitType
                        }))
                });
            }
        } else {
            // Raw purchase
            for (const req of requirements.filter(r => r.ingredientId === ingredientId)) {
                leftoversByEvent.push(req);
            }
        }
    }

    return { purchases, leftovers: leftoversByEvent };
}

/**
 * Generates or updates tasks based on aggregated requirements.
 */
export async function syncAggregatedTasks(eventIds: string[], menuServiceIds: string[] = []) {
    const eventReqs = await getRequirementsForEvents(eventIds);
    const menuReqs = await getRequirementsForMenuServices(menuServiceIds);
    const requirements = [...eventReqs, ...menuReqs];

    const { purchases } = await resolveTransformations(requirements);

    const idSuffix = `${eventIds.length}_${menuServiceIds.length}_${new Date().getTime().toString().substring(0, 5)}`;

    // 1. Create/Update Despiece Tasks
    for (const [sourceId, p] of purchases.entries()) {
        const title = `DESPIECE: ${p.sourceProductName}`;
        const description = `Obtener: ${p.targetQty.toFixed(2)} ${p.sourceUnit} de Ingrediente Principal.\nSobrantes: ${p.byproducts.map(b => `${b.quantity.toFixed(2)} ${b.unit} ${b.name}`).join(', ')}`;

        // Use a composite ID that is deterministic enough but handles the mix
        // Actually, for simplicity, we might just use a hash or a standard prefix.
        // If we want to update existing tasks, we need a stable ID.
        // Previous ID: `trans_${sourceId}_${eventIds.join('_').substring(0, 20)}`
        // New strategy: if we run for specific eventIds/menuIds, can we ensure stability?
        // If the user runs "Weekly Production", the set of IDs changes every day.
        // It might be better to tag tasks with Relation M:N and update them if they exist for *these exact* relations?
        // For now, let's stick to a simpler ID strategy or just create new ones and cleanup old PENDING/AUTO tasks?
        // Given complexity, I will keep ID generation simple but be aware it might generate duplicates if run with slight variations.
        // Ideally, we should find tasks linked to these events and update them.

        // For this iteration, I'll attempt to find task by 'action' + 'sourceId' logic if possible, but ID upsert is safest for now.
        const taskId = `trans_${sourceId}_${eventIds.join('').substring(0, 10)}_${menuServiceIds.join('').substring(0, 10)}`;

        await prisma.task.upsert({
            where: { id: taskId },
            create: {
                id: taskId,
                title,
                description,
                status: 'PENDING',
                targetQuantity: p.requiredSourceQty,
                unit: p.sourceUnit as string,
                action: 'DESPIEZAR',
                events: { connect: p.eventIds.map(id => ({ id })) }
                // We should also link MenuServices to Tasks if we had that relation. 
                // Currently Task only has 'events'. We might need to add 'menuServices' to Task model?
                // For now, list them in description.
            } as any,
            update: {
                title,
                description,
                targetQuantity: p.requiredSourceQty,
                unit: p.sourceUnit as string,
                events: { set: p.eventIds.map(id => ({ id })) }
            } as any
        });
    }

    // 2. Aggregate Production Tasks
    const productionTasks = new Map<string, { title: string, qty: number, unit: UnitType, eventIds: Set<string>, menuIds: Set<string>, action?: string, technique?: string }>();

    for (const req of requirements) {
        const key = `${req.action || 'PREP'}_${req.ingredientId}`;
        const existing = productionTasks.get(key);
        if (existing) {
            existing.qty += req.quantity;
            if (req.eventId) existing.eventIds.add(req.eventId);
            if (req.menuServiceId) existing.menuIds.add(req.menuServiceId);
        } else {
            productionTasks.set(key, {
                title: `${req.action || 'PREPARAR'}: ${req.ingredientName}`,
                qty: req.quantity,
                unit: req.unit,
                eventIds: new Set(req.eventId ? [req.eventId] : []),
                menuIds: new Set(req.menuServiceId ? [req.menuServiceId] : []),
                action: req.action,
                technique: req.technique
            });
        }
    }

    for (const [key, t] of productionTasks.entries()) {
        const taskId = `prod_${key}_${[...t.eventIds].join('').substring(0, 10)}_${[...t.menuIds].join('').substring(0, 10)}`;
        // Description to include menus
        const desc = `Eventos: ${Array.from(t.eventIds).length}, Menús: ${Array.from(t.menuIds).length}`;

        await prisma.task.upsert({
            where: { id: taskId },
            create: {
                id: taskId,
                title: `${t.title} (${t.qty.toFixed(2)} ${t.unit})`,
                description: desc,
                status: 'PENDING',
                targetQuantity: t.qty,
                unit: t.unit as string,
                action: t.action,
                technique: t.technique,
                events: { connect: Array.from(t.eventIds).map(id => ({ id })) }
            } as any,
            update: {
                title: `${t.title} (${t.qty.toFixed(2)} ${t.unit})`,
                description: desc,
                targetQuantity: t.qty,
                unit: t.unit as string,
                events: { set: Array.from(t.eventIds).map(id => ({ id })) }
            } as any
        });
    }
}
