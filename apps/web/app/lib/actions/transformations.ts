'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
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
        testQuantity: Number(formData.get('testQuantity')),
        testUnit: formData.get('testUnit'),
        outputs: outputsData
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
            message: 'Error de validación. Revise los datos.',
        };
    }

    const { sourceProductId, name, testQuantity, testUnit, outputs } = validatedFields.data;

    try {
        // Get source product to calculate pricing
        const sourceProduct = await prisma.supplierProduct.findUnique({
            where: { id: sourceProductId },
            select: { price: true, unit: true }
        });

        if (!sourceProduct) {
            return { message: 'Producto fuente no encontrado.' };
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
                        // Calculate price per unit based on source product
                        // Formula: (sourcePrice / testQuantity) * costAllocation
                        // This gives the cost per KG of this output (Assuming KG output)
                        // If testUnit is different, we might need conversion?
                        // For MVP, we assume the cost allocation handles the value distribution regardless of units.
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
        });

    } catch (error) {
        console.error(error);
        return { message: 'Error al guardar la transformación.' };
    }

    revalidatePath(`/dashboard/products/${sourceProductId}`);
    redirect(`/dashboard/products/${sourceProductId}`);
}

export async function updateTransformation(id: string, prevState: TransformationFormState, formData: FormData) {
    const rawOutputs = formData.get('outputs') as string;
    const outputsData = rawOutputs ? JSON.parse(rawOutputs) : [];

    // Parse the form data using the Schema
    const validatedFields = UpdateTransformationSchema.safeParse({
        id: id,
        sourceProductId: formData.get('sourceProductId'),
        name: formData.get('name'),
        testQuantity: Number(formData.get('testQuantity')),
        testUnit: formData.get('testUnit'),
        outputs: outputsData
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
            message: 'Error de validación. Revise los datos.',
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
        });

    } catch (error) {
        console.error(error);
        return { message: 'Error al actualizar la transformación.' };
    }

    revalidatePath(`/dashboard/products/${sourceProductId}`);
    redirect(`/dashboard/products/${sourceProductId}`);
}

export async function deleteTransformation(id: string) {
    try {
        const transformation = await prisma.transformation.findUnique({
            where: { id },
            select: { sourceProductId: true }
        });

        if (!transformation) {
            throw new Error('Transformation not found');
        }

        await prisma.transformation.delete({
            where: { id },
        });

        revalidatePath(`/dashboard/products/${transformation.sourceProductId}`);
    } catch (error) {
        console.error('Error deleting transformation:', error);
        throw error;
    }
}
