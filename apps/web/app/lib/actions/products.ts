'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- Master Product Schemas ---
const MasterProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
    category: z.string().optional(),
    description: z.string().optional(),
});
const CreateMasterProduct = MasterProductSchema.omit({ id: true });
const UpdateMasterProduct = MasterProductSchema;

// --- Supplier Product Schemas ---
const ProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
    // supplier: z.string().optional(), // Legacy: We still accept it for compatibility but new flow prefers supplierId
    supplierId: z.string().optional(),
    masterProductId: z.string().optional(),
    price: z.coerce.number().min(0, { message: 'El precio debe ser mayor o igual a 0.' }),
    unit: z.string().min(1, { message: 'La unidad es obligatoria.' }),
    quantityPerUnit: z.coerce.number().optional().nullable(),
    sapiensWorld: z.string().optional(),
});

const CreateProduct = ProductSchema.omit({ id: true });
const UpdateProduct = ProductSchema;

export type ProductFormState = {
    errors?: {
        name?: string[];
        supplierId?: string[];
        masterProductId?: string[];
        price?: string[];
        unit?: string[];
        quantityPerUnit?: string[];
        sapiensWorld?: string[];
    };
    message: string;
};

// --- MASTER PRODUCT ACTIONS ---

export async function createMasterProduct(prevState: any, formData: FormData) {
    const validatedFields = CreateMasterProduct.safeParse({
        name: formData.get('name'),
        category: formData.get('category'),
        description: formData.get('description'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios.',
        };
    }

    const { name, category, description } = validatedFields.data;

    try {
        await prisma.masterProduct.create({
            data: {
                name,
                category,
                description,
            },
        });
    } catch (error) {
        return { message: 'Error al crear producto maestro.' };
    }

    revalidatePath('/dashboard/products');
    return { message: 'Producto Maestro creado.' };
}

// --- SUPPLIER PRODUCT ACTIONS ---

export async function createProduct(prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const validatedFields = CreateProduct.safeParse({
        name: formData.get('name'),
        supplierId: formData.get('supplierId'),
        masterProductId: formData.get('masterProductId'),
        price: formData.get('price'),
        unit: formData.get('unit'),
        quantityPerUnit: formData.get('quantityPerUnit'),
        sapiensWorld: formData.get('sapiensWorld'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios. Error al crear producto.',
        };
    }

    const { name, supplierId, masterProductId, price, unit, quantityPerUnit, sapiensWorld } = validatedFields.data;

    try {
        await prisma.$transaction(async (tx) => {
            // Find supplier name if ID is provided, for legacy field population
            let supplierName = '';
            if (supplierId) {
                const s = await tx.supplier.findUnique({ where: { id: supplierId } });
                if (s) supplierName = s.name;
            }

            const product = await tx.supplierProduct.create({
                data: {
                    name,
                    supplier: supplierName, // Legacy
                    supplierId,
                    masterProductId,
                    price,
                    unit,
                    quantityPerUnit: quantityPerUnit || null,
                    sapiensWorld,
                },
            });

            // Also create as an Ingredient so it appears in recipes
            // If linked to MasterProduct, use Master Product Name? Or specific variant name?
            // For now, keep using the specific product name to allow differentiation (e.g. "Solomillo Vaca" vs "Solomillo Ternera")
            await tx.ingredient.create({
                data: {
                    name: product.name,
                    pricingUnit: product.unit,
                    pricePerUnit: product.price,
                }
            });
        });
    } catch (error) {
        return {
            message: 'Error de base de datos: No se pudo crear el producto.',
        };
    }

    revalidatePath('/dashboard/products');
    // If we have a master product view, we might want to stay there, but for now redirecting to main list is fine
    redirect('/dashboard/products');
    return { message: '' };
}

export async function updateProduct(id: string, prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const validatedFields = UpdateProduct.safeParse({
        id: id,
        name: formData.get('name'),
        supplierId: formData.get('supplierId'),
        masterProductId: formData.get('masterProductId'),
        price: formData.get('price'),
        unit: formData.get('unit'),
        quantityPerUnit: formData.get('quantityPerUnit'),
        sapiensWorld: formData.get('sapiensWorld'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios. Error al actualizar producto.',
        };
    }

    const { name, supplierId, masterProductId, price, unit, quantityPerUnit, sapiensWorld } = validatedFields.data;

    try {
        await prisma.$transaction(async (tx) => {
            // Find supplier name
            let supplierName = undefined;
            if (supplierId) {
                const s = await tx.supplier.findUnique({ where: { id: supplierId } });
                if (s) supplierName = s.name;
            }

            await tx.supplierProduct.update({
                where: { id },
                data: {
                    name,
                    supplier: supplierName, // Updates legacy name if supplierId changed
                    supplierId,
                    masterProductId,
                    price,
                    unit,
                    quantityPerUnit: quantityPerUnit || null,
                    sapiensWorld,
                },
            });

            // Try to update corresponding Ingredient
            try {
                await tx.ingredient.updateMany({
                    where: { name: name },
                    data: {
                        pricePerUnit: price,
                        pricingUnit: unit
                    }
                });
            } catch (e) {
                console.warn("Could not sync ingredient", e);
            }
        });
    } catch (error) {
        return {
            message: 'Error de base de datos: No se pudo actualizar el producto.',
        };
    }

    revalidatePath('/dashboard/products');
    redirect('/dashboard/products');
    return { message: '' };
}

export async function deleteProduct(id: string) {
    try {
        await prisma.supplierProduct.delete({
            where: { id },
        });
        revalidatePath('/dashboard/products');
    } catch (error) {
        return { message: 'Error de base de datos: No se pudo borrar el producto.' };
    }
}
