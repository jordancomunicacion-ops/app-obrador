
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Linking SupplierProducts to Ingredients...');

    // 1. Fetch all SupplierProducts that are not yet linked
    const products = await prisma.supplierProduct.findMany({
        where: { ingredientId: null }
    });

    console.log(`Found ${products.length} unlinked products.`);

    let linkedCount = 0;
    let createdCount = 0;

    for (const product of products) {
        // 2. Try to find an existing Ingredient with the same name
        const ingredient = await prisma.ingredient.findFirst({
            where: { name: { equals: product.name, mode: 'insensitive' } }
        });

        if (ingredient) {
            // Link to existing
            await prisma.supplierProduct.update({
                where: { id: product.id },
                data: { ingredientId: ingredient.id }
            });
            linkedCount++;
        } else {
            // Create new Ingredient and link
            try {
                const newIngredient = await prisma.ingredient.create({
                    data: {
                        name: product.name,
                        pricingUnit: product.unit,
                        pricePerUnit: product.price,
                    }
                });

                await prisma.supplierProduct.update({
                    where: { id: product.id },
                    data: { ingredientId: newIngredient.id }
                });
                createdCount++;
            } catch (e) {
                console.error(`Error creating ingredient for product ${product.name}:`, e);
            }
        }
    }

    console.log(`Migration complete.`);
    console.log(`Linked to existing ingredients: ${linkedCount}`);
    console.log(`Created new ingredients: ${createdCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
