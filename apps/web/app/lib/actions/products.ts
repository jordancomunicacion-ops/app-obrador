'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { scopedLocationId, locationScope } from '@/app/lib/auth/scope';

// --- Master Product Schemas ---
const MasterProductSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
    category: z.string().optional(),
    description: z.string().optional(),
});
const CreateMasterProduct = MasterProductSchema.omit({ id: true });
const UpdateMasterProduct = MasterProductSchema;

// --- Unified Product Flow Schemas ---
const SupplierEntrySchema = z.object({
    id: z.string().optional(), // For updates
    supplierName: z.string().min(1, { message: 'El proveedor es obligatorio.' }),
    price: z.coerce.number().min(0, { message: 'El precio debe ser >= 0.' }),
    unit: z.string().min(1, { message: 'La unidad es obligatoria.' }),
    quantityPerUnit: z.coerce.number().optional().nullable(),
});

const ProductFlowSchema = z.object({
    name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
    category: z.string().optional(),
    sapiensWorld: z.string().optional(),
    suppliers: z.array(SupplierEntrySchema).min(1, { message: 'Debes añadir al menos un proveedor.' }),
});

export type ProductFormState = {
    errors?: {
        name?: string[];
        category?: string[];
        sapiensWorld?: string[];
        suppliers?: string[];
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
                locationId: await scopedLocationId(),
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
    let suppliersJson = formData.get('suppliersJson') as string;
    let suppliers = [];
    try {
        suppliers = JSON.parse(suppliersJson || '[]');
    } catch (e) {
        return { message: 'Error en el formato de proveedores.' };
    }

    const validatedFields = ProductFlowSchema.safeParse({
        name: formData.get('name'),
        category: formData.get('category'),
        sapiensWorld: formData.get('sapiensWorld'),
        suppliers: suppliers,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors as any,
            message: 'Faltan campos obligatorios.',
        };
    }

    const { name, category, sapiensWorld, suppliers: validatedSuppliers } = validatedFields.data;
    const locationId = await scopedLocationId();

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create Master Product
            const masterProduct = await tx.masterProduct.create({
                data: {
                    locationId,
                    name,
                    category,
                },
            });

            // 2. Create Supplier Products
            for (const s of validatedSuppliers) {
                // Find or create supplier
                const supplierObj = await tx.supplier.upsert({
                    where: { name: s.supplierName },
                    update: {},
                    create: { name: s.supplierName, locationId },
                });

                // Create SupplierProduct
                const supplierProduct = await tx.supplierProduct.create({
                    data: {
                        locationId,
                        name: `${name} (${s.supplierName})`,
                        supplier: s.supplierName,
                        supplierId: supplierObj.id,
                        masterProductId: masterProduct.id,
                        price: s.price,
                        unit: s.unit,
                        quantityPerUnit: s.quantityPerUnit,
                        sapiensWorld,
                    },
                });

                // Create/Find base ingredient for direct use
                // NOTE: For now we create one ingredient per supplier product if they are used directly.
                // In the yield test flow, they will produce a common transformed ingredient.
                await tx.ingredient.create({
                    data: {
                        name: supplierProduct.name,
                        pricingUnit: s.unit,
                        pricePerUnit: s.price,
                        supplierProducts: {
                            connect: { id: supplierProduct.id }
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.error(error);
        return {
            message: 'Error de base de datos: No se pudo crear el producto.',
        };
    }

    revalidatePath('/dashboard/products');
    redirect('/dashboard/products');
    return { message: '' };
}

export async function updateProduct(id: string, prevState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    // Verifica que el producto pertenece al local del usuario antes de editar.
    const inScope = await prisma.masterProduct.findFirst({
        where: { ...(await locationScope()), id },
        select: { id: true },
    });
    if (!inScope) {
        return { message: 'No autorizado: el producto no pertenece a tu local.' };
    }

    const suppliersJson = formData.get('suppliersJson') as string;
    let suppliersInput = [];
    try {
        suppliersInput = JSON.parse(suppliersJson || '[]');
    } catch (e) {
        return { message: 'Error en el formato de proveedores.' };
    }

    const validatedFields = ProductFlowSchema.safeParse({
        name: formData.get('name'),
        category: formData.get('category'),
        sapiensWorld: formData.get('sapiensWorld'),
        suppliers: suppliersInput,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors as any,
            message: 'Faltan campos obligatorios.',
        };
    }

    const { name, category, sapiensWorld, suppliers } = validatedFields.data;

    try {
        await prisma.$transaction(async (tx) => {
            // Update Master Product
            await tx.masterProduct.update({
                where: { id },
                data: {
                    name,
                    category,
                },
            });

            // Handle Suppliers: Get current ones to identify what to remove
            const currentSuppliers = await tx.supplierProduct.findMany({
                where: { masterProductId: id }
            });

            const supplierIdsToKeep = suppliers.filter(s => s.id).map(s => s.id);

            // Delete removed suppliers
            await tx.supplierProduct.deleteMany({
                where: {
                    masterProductId: id,
                    id: { notIn: supplierIdsToKeep as string[] }
                }
            });

            // Update or Create suppliers
            for (const s of suppliers) {
                // Find or create global supplier entity
                const supplierObj = await tx.supplier.upsert({
                    where: { name: s.supplierName },
                    update: {},
                    create: { name: s.supplierName },
                });

                if (s.id) {
                    const sp = await tx.supplierProduct.update({
                        where: { id: s.id },
                        data: {
                            name: `${name} (${s.supplierName})`,
                            supplier: s.supplierName,
                            supplierId: supplierObj.id,
                            price: s.price,
                            unit: s.unit,
                            quantityPerUnit: s.quantityPerUnit,
                            sapiensWorld,
                        },
                        include: { ingredient: true }
                    });

                    // Sync the linked ingredient
                    if (sp.ingredientId) {
                        await tx.ingredient.update({
                            where: { id: sp.ingredientId },
                            data: {
                                name: sp.name,
                                pricingUnit: sp.unit,
                                pricePerUnit: sp.price
                            }
                        });
                    }
                } else {
                    const sp = await tx.supplierProduct.create({
                        data: {
                            name: `${name} (${s.supplierName})`,
                            supplier: s.supplierName,
                            supplierId: supplierObj.id,
                            masterProductId: id,
                            price: s.price,
                            unit: s.unit,
                            quantityPerUnit: s.quantityPerUnit,
                            sapiensWorld,
                        }
                    });

                    // Create base ingredient
                    await tx.ingredient.create({
                        data: {
                            name: sp.name,
                            pricingUnit: sp.unit,
                            pricePerUnit: sp.price,
                            supplierProducts: {
                                connect: { id: sp.id }
                            }
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error(error);
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
        const scoped = await prisma.masterProduct.findFirst({
            where: { ...(await locationScope()), id },
            select: { id: true },
        });
        if (!scoped) {
            return { message: 'No autorizado: el producto no pertenece a tu local.' };
        }
        await prisma.masterProduct.delete({
            where: { id },
        });
        revalidatePath('/dashboard/products');
    } catch (error) {
        console.error(error);
        return { message: 'Error de base de datos: No se pudo borrar el producto.' };
    }
}
