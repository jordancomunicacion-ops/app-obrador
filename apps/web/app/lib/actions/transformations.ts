'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Schema Validation
const OutputSchema = z.object({
    ingredientId: z.string().optional(), // Existing IG
    newIngredientName: z.string().optional(), // Or create new
    weight: z.coerce.number().min(0), // Weight obtained from test
    costAllocation: z.coerce.number().min(0).default(1), // 1 = Proportional, >1 = Premium, <1 = Byproduct
}).refine(data => data.ingredientId || (data.newIngredientName && data.newIngredientName.trim() !== ''), {
    message: "Debe seleccionar un ingrediente o escribir un nombre nuevo."
});

const TransformationSchema = z.object({
    sourceProductId: z.string(),
    name: z.string().min(1, "El nombre es obligatorio"),
    testQuantity: z.coerce.number().gt(0, "La cantidad del test debe ser mayor a 0"),
    testUnit: z.string().default('KG'),
    outputs: z.array(OutputSchema).min(1, "Debe haber al menos una salida (aunque sea merma)"),
});

const UpdateTransformationSchema = TransformationSchema.extend({
    id: z.string(),
});

export type TransformationFormState = {
    message?: string | null;
    errors?: Record<string, string[]>;
};

export async function createTransformation(prevState: TransformationFormState, formData: FormData) {
    const rawOutputs = formData.get('outputs') as string;
    const outputsData = rawOutputs ? JSON.parse(rawOutputs) : [];

    const validatedFields = TransformationSchema.safeParse({
        sourceProductId: formData.get('sourceProductId'),
        name: formData.get('name'),
        testQuantity: formData.get('testQuantity'),
        testUnit: formData.get('testUnit') || 'KG',
        outputs: outputsData
    });

    if (!validatedFields.success) {
        console.error('Validation Error (Create):', validatedFields.error.flatten());
        return {
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
            message: 'Error de validación. Revise los datos.',
        };
    }

    const { sourceProductId, name, testQuantity, testUnit, outputs } = validatedFields.data;

    try {
        // Get source product to calculate pricing and redirection
        const sourceProduct = await prisma.supplierProduct.findUnique({
            where: { id: sourceProductId },
            select: { price: true, unit: true, masterProductId: true }
        });

        if (!sourceProduct || !sourceProduct.masterProductId) {
            return { message: 'Producto fuente o maestro no encontrado.' };
        }

        await prisma.$transaction(async (tx) => {
            // 1. Create the Transformation Header
            const transformation = await tx.transformation.create({
                data: {
                    name,
                    sourceProductId,
                    testQuantity,
                    // testUnit, // Disabled until Prisma Client regeneration succeeds
                }
            });

            // 2. Process outputs
            for (const output of outputs) {
                let ingredientId = output.ingredientId;

                // Handle Name-based Resolution (UI sends names now)
                if (!ingredientId && output.newIngredientName) {
                    const normalizedName = output.newIngredientName.trim();

                    // 1. Try to find existing
                    const existingIng = await tx.ingredient.findFirst({
                        where: { name: { equals: normalizedName, mode: 'insensitive' } } // Case insensitive match
                    });

                    if (existingIng) {
                        ingredientId = existingIng.id;
                    } else {
                        // 2. Create new if not found
                        const calculatedPrice = (sourceProduct.price / testQuantity) * output.costAllocation;

                        const newIng = await tx.ingredient.create({
                            data: {
                                name: normalizedName,
                                pricePerUnit: calculatedPrice,
                                pricingUnit: 'KG', // Outputs are usually measured in specific units, defaulting to KG for consistency
                                yieldPercent: 100, // Default 100%
                            }
                        });
                        ingredientId = newIng.id;
                    }
                }

                if (ingredientId) {
                    // Calculate percentage yield
                    // Yield % = OutputWeight / InputWeight * 100
                    const percentage = (output.weight / testQuantity) * 100;

                    await tx.transformationOutput.create({
                        data: {
                            transformationId: transformation.id,
                            ingredientId: ingredientId,
                            weight: output.weight,
                            percentage: percentage,
                            costAllocation: output.costAllocation
                        }
                    });
                }
            }

            // 3. Recalculate Prices
            await recalculateIngredientPrices(transformation.id, tx);
        });

        revalidatePath(`/dashboard/products/${sourceProduct.masterProductId}`);
        redirect(`/dashboard/products/${sourceProduct.masterProductId}`);

    } catch (error) {
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(error);
        return { message: 'Error al guardar la transformación.' };
    }
}

export async function updateTransformation(id: string, prevState: TransformationFormState, formData: FormData) {
    const rawOutputs = formData.get('outputs') as string;
    const outputsData = rawOutputs ? JSON.parse(rawOutputs) : [];

    // Parse the form data using the Schema
    const validatedFields = UpdateTransformationSchema.safeParse({
        id: id,
        sourceProductId: formData.get('sourceProductId'),
        name: formData.get('name'),
        testQuantity: formData.get('testQuantity'),
        testUnit: formData.get('testUnit') || 'KG',
        outputs: outputsData
    });

    if (!validatedFields.success) {
        console.error('Validation Error (Update):', validatedFields.error.flatten());
        return {
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
            message: 'Error de validación. Revise los datos (ID: ' + id + ')',
        };
    }

    const { sourceProductId, name, testQuantity, testUnit, outputs } = validatedFields.data;

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Update Transformation Header
            await tx.transformation.update({
                where: { id },
                data: { name, testQuantity /*, testUnit */ }
            });

            // 2. Clear old outputs (easier than diffing for now)
            await tx.transformationOutput.deleteMany({
                where: { transformationId: id }
            });

            // 3. Re-create outputs
            for (const output of outputs) {
                let ingredientId = output.ingredientId;

                if (!ingredientId && output.newIngredientName) {
                    const normalizedName = output.newIngredientName.trim();
                    const existingIng = await tx.ingredient.findFirst({
                        where: { name: { equals: normalizedName, mode: 'insensitive' } }
                    });

                    if (existingIng) {
                        ingredientId = existingIng.id;
                    } else {
                        const newIng = await tx.ingredient.create({
                            data: { name: normalizedName, pricePerUnit: 0 }
                        });
                        ingredientId = newIng.id;
                    }
                }

                if (ingredientId) {
                    const percentage = (output.weight / testQuantity) * 100;

                    await tx.transformationOutput.create({
                        data: {
                            transformationId: id,
                            ingredientId: ingredientId,
                            weight: output.weight,
                            percentage: percentage,
                            costAllocation: output.costAllocation
                        }
                    });
                }
            }

            // 4. Recalculate Prices
            await recalculateIngredientPrices(id, tx);
        });

        // Get masterProductId for correct redirection
        const sourceProd = await prisma.supplierProduct.findUnique({
            where: { id: sourceProductId },
            select: { masterProductId: true }
        });

        const redirectPath = sourceProd?.masterProductId
            ? `/dashboard/products/${sourceProd.masterProductId}`
            : `/dashboard/products`;

        revalidatePath(redirectPath);
        redirect(redirectPath);

    } catch (error) {
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(error);
        return { message: 'Error al actualizar la transformación.' };
    }
}

export async function deleteTransformation(id: string) {
    try {
        const transformation = await prisma.transformation.findUnique({
            where: { id },
            select: {
                sourceProduct: {
                    select: { masterProductId: true }
                }
            }
        });

        if (!transformation) {
            throw new Error('Transformation not found');
        }

        await prisma.transformation.delete({
            where: { id },
        });

        if (transformation?.sourceProduct?.masterProductId) {
            revalidatePath(`/dashboard/products/${transformation.sourceProduct.masterProductId}`);
        }
    } catch (error) {
        console.error('Error deleting transformation:', error);
        throw error;
    }
}

/**
 * Recalculates and updates the pricePerUnit of all ingredients produced by this transformation.
 * Formula: (SourceProductPrice * TestQuantity * CostAllocation) / OutputWeight
 */
async function recalculateIngredientPrices(transformationId: string, tx: any) {
    const transformation = await tx.transformation.findUnique({
        where: { id: transformationId },
        include: {
            sourceProduct: true,
            outputs: true
        }
    });

    if (!transformation || !transformation.sourceProduct) return;

    const sourcePrice = transformation.sourceProduct.price || 0;
    const testQty = transformation.testQuantity;

    const totalInputCost = sourcePrice * testQty;

    let totalWeightedMass = 0;
    for (const output of transformation.outputs) {
        if (output.weight > 0) {
            totalWeightedMass += output.weight * (output.costAllocation || 1);
        }
    }

    if (totalWeightedMass === 0) return;

    const costPerWeightedUnit = totalInputCost / totalWeightedMass;

    for (const output of transformation.outputs) {
        if (output.weight > 0) {
            const newPricePerUnit = costPerWeightedUnit * (output.costAllocation || 1);
            await tx.ingredient.update({
                where: { id: output.ingredientId },
                data: {
                    pricePerUnit: newPricePerUnit
                }
            });
        }
    }
}
