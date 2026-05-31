'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateRecipeSchema, UpdateRecipeSchema, type RecipeFormState } from '@/app/lib/definitions';
import { scopedLocationId, locationScope } from '@/app/lib/auth/scope';

// --- RECIPES ---

export async function createRecipe(prevState: RecipeFormState, formData: FormData) {
    // Complex form data handling might be needed here if items are passed as JSON string or multiple fields
    // For simplicity MVP: We'll assume Items are managed via client-side state and passed maybe as a hidden JSON input 
    // or we parse specific naming conventions (items[0].id, etc).
    // Let's try to parse a hidden JSON field for 'items' to keep it clean.

    const itemsJson = formData.get('items') as string;
    const itemsRaw = itemsJson ? JSON.parse(itemsJson) : [];

    const stepsJson = formData.get('steps') as string;
    const stepsRaw = stepsJson ? JSON.parse(stepsJson) : [];

    const validatedFields = CreateRecipeSchema.safeParse({
        name: formData.get('name'),
        category: formData.get('category'), // New fixed enum
        classification: formData.get('classification'), // Old 'category' (free text)
        packaging: formData.get('packaging'),
        portions: formData.get('portions'),
        prepTime: formData.get('prepTime'),
        cookTime: formData.get('cookTime'),
        yieldQuantity: formData.get('yieldQuantity'),
        yieldUnit: formData.get('yieldUnit'),
        instructions: formData.get('instructions'),
        isGlutenFree: formData.get('isGlutenFree') === 'on',
        isVegan: formData.get('isVegan') === 'on',
        isVegetarian: formData.get('isVegetarian') === 'on',
        isLactoseFree: formData.get('isLactoseFree') === 'on',
        allergens: formData.get('allergens'),
        items: itemsRaw,
        steps: stepsRaw,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios o datos inválidos.',
        };
    }

    const {
        name, category, classification, packaging, portions, prepTime, cookTime,
        yieldQuantity, yieldUnit, instructions, items, steps,
        isGlutenFree, isVegan, isVegetarian, isLactoseFree, allergens
    } = validatedFields.data;

    try {
        await prisma.recipe.create({
            data: {
                locationId: await scopedLocationId(),
                name,
                category: category as any,
                classification,
                packaging,
                portions,
                prepTime,
                cookTime,
                yieldQuantity: yieldQuantity || 1,
                yieldUnit: yieldUnit as any || 'UD',
                instructions: instructions || '',
                isGlutenFree,
                isVegan,
                isVegetarian,
                isLactoseFree,
                allergens,
                items: {
                    create: items?.map(item => ({
                        type: item.type,
                        ingredientId: item.ingredientId || undefined,
                        subRecipeId: item.subRecipeId || undefined,
                        sourceProductId: item.sourceProductId || undefined,
                        quantityGross: item.quantityGross,
                        unit: item.unit
                    }))
                },
                steps: {
                    create: steps?.map(step => {
                        return {
                            order: step.order,
                            description: step.description || '',
                            action: step.action || null,
                            subAction: step.subAction || null,
                            stepIngredients: {
                                create: step.ingredients?.map(ing => ({
                                    ingredientId: ing.type === 'INGREDIENT' ? ing.id : undefined,
                                    subRecipeId: ing.type === 'SUB_RECIPE' ? ing.id : undefined,
                                    action: ing.action || null,
                                    subAction: ing.subAction || null
                                }))
                            }
                        };
                    })
                }
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo crear la receta.',
        };
    }

    revalidatePath('/dashboard/recipes');
    redirect('/dashboard/recipes');
}

export async function updateRecipe(
    id: string,
    prevState: RecipeFormState,
    formData: FormData,
) {
    const itemsJson = formData.get('items') as string;
    const itemsRaw = itemsJson ? JSON.parse(itemsJson) : [];

    const stepsJson = formData.get('steps') as string;
    const stepsRaw = stepsJson ? JSON.parse(stepsJson) : [];

    const validatedFields = UpdateRecipeSchema.safeParse({
        id: id,
        name: formData.get('name'),
        category: formData.get('category'),
        classification: formData.get('classification'),
        packaging: formData.get('packaging'),
        portions: formData.get('portions'),
        prepTime: formData.get('prepTime'),
        cookTime: formData.get('cookTime'),
        yieldQuantity: formData.get('yieldQuantity'),
        yieldUnit: formData.get('yieldUnit'),
        instructions: formData.get('instructions'),
        isGlutenFree: formData.get('isGlutenFree') === 'on',
        isVegan: formData.get('isVegan') === 'on',
        isVegetarian: formData.get('isVegetarian') === 'on',
        isLactoseFree: formData.get('isLactoseFree') === 'on',
        allergens: formData.get('allergens'),
        items: itemsRaw,
        steps: stepsRaw,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios.',
        };
    }

    // Verifica que la receta pertenece al ámbito (local) del usuario antes de editar.
    const inScope = await prisma.recipe.findFirst({
        where: { ...(await locationScope()), id },
        select: { id: true },
    });
    if (!inScope) {
        return { message: 'No autorizado: la receta no pertenece a tu local.' };
    }

    const {
        name, category, classification, packaging, portions, prepTime, cookTime,
        yieldQuantity, yieldUnit, instructions, items, steps,
        isGlutenFree, isVegan, isVegetarian, isLactoseFree, allergens
    } = validatedFields.data;

    try {
        // Transactional update: Delete old items/steps and create new ones is simplest for MVP
        // Better strategy: upsert/delete difference.
        await prisma.$transaction(async (tx) => {
            // Update basic info
            await tx.recipe.update({
                where: { id },
                data: {
                    name,
                    category: category as any,
                    classification,
                    packaging,
                    portions,
                    prepTime,
                    cookTime,
                    yieldQuantity: yieldQuantity || 1,
                    yieldUnit: yieldUnit as any || 'UD',
                    instructions: instructions || '',
                    isGlutenFree,
                    isVegan,
                    isVegetarian,
                    isLactoseFree,
                    allergens,
                }
            });

            // Delete existing items
            await tx.recipeItem.deleteMany({
                where: { recipeId: id }
            });

            // Delete existing steps
            await tx.recipeStep.deleteMany({
                where: { recipeId: id }
            });

            // Create new items
            if (items && items.length > 0) {
                await tx.recipeItem.createMany({
                    data: items.map(item => ({
                        recipeId: id,
                        type: item.type,
                        ingredientId: item.ingredientId || null,
                        subRecipeId: item.subRecipeId || null,
                        sourceProductId: item.sourceProductId || null,
                        quantityGross: item.quantityGross,
                        unit: item.unit
                    }))
                });
            }

            // Create new steps
            // Create new steps
            if (steps && steps.length > 0) {
                for (const step of steps) {
                    await tx.recipeStep.create({
                        data: {
                            recipeId: id,
                            order: step.order,
                            description: step.description || '',
                            action: step.action || null,
                            subAction: step.subAction || null,
                            stepIngredients: {
                                create: step.ingredients?.map(ing => ({
                                    ingredientId: ing.type === 'INGREDIENT' ? ing.id : undefined,
                                    subRecipeId: ing.type === 'SUB_RECIPE' ? ing.id : undefined,
                                    action: ing.action || null,
                                    subAction: ing.subAction || null
                                }))
                            }
                        }
                    });
                }
            }
        });

    } catch (error) {
        console.error('Database Error:', error);
        // Debug logging to file
        try {
            const fs = await import('fs');
            // Log full error details including code and meta if available
            const errorLog = `Date: ${new Date().toISOString()}\nError: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}\nItems: ${JSON.stringify(items)}\nSteps: ${JSON.stringify(steps)}\n\n`;
            fs.appendFileSync('db_error_log.txt', errorLog);
        } catch (fsError) {
            console.error('Failed to write log', fsError);
        }

        return {
            message: `Error de base de datos: ${(error as any).message || 'No se pudo actualizar la receta.'}`,
        };
    }

    revalidatePath('/dashboard/recipes');
    redirect('/dashboard/recipes');
}

export async function deleteRecipe(id: string) {
    try {
        // Verifica que la receta pertenece al ámbito (local) del usuario antes de borrar.
        const scoped = await prisma.recipe.findFirst({
            where: { ...(await locationScope()), id },
            select: { id: true },
        });
        if (!scoped) {
            return { message: 'No autorizado: la receta no pertenece a tu local.' };
        }
        await prisma.recipe.delete({
            where: { id },
        });
        revalidatePath('/dashboard/recipes');
        return { message: 'Receta eliminada.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error de base de datos: No se pudo eliminar la receta.' };
    }
}
