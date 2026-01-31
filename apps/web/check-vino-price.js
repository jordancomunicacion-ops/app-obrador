
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Investigating Vino price...");

    const ingredients = await prisma.ingredient.findMany({
        where: { name: { contains: 'Vino', mode: 'insensitive' } },
        include: { supplierProducts: true }
    });

    for (const ing of ingredients) {
        console.log(`Ingredient: ${ing.name} (ID: ${ing.id})`);
        console.log(`  Generic Price: ${ing.pricePerUnit} / ${ing.pricingUnit}`);
        for (const sp of ing.supplierProducts) {
            console.log(`  Supplier Product: ${sp.name} [${sp.id}]`);
            console.log(`    Price: ${sp.price} / ${sp.unit}`);
            console.log(`    QtyPerUnit: ${sp.quantityPerUnit}`);
        }
    }

    const recipes = await prisma.recipe.findMany({
        where: { name: { contains: 'Salsa vino', mode: 'insensitive' } },
        include: {
            items: {
                include: {
                    ingredient: true,
                    sourceProduct: true
                }
            }
        }
    });

    for (const recipe of recipes) {
        console.log(`\nRecipe: ${recipe.name} (ID: ${recipe.id})`);
        console.log(`  Portions: ${recipe.portions}`);
        for (const item of recipe.items) {
            console.log(`  Item: ${item.type} Qty: ${item.quantityGross} ${item.unit}`);
            console.log(`    Ingredient: ${item.ingredient?.name} (Generic Price: ${item.ingredient?.pricePerUnit})`);
            console.log(`    Source Product: ${item.sourceProduct?.name} (Price: ${item.sourceProduct?.price})`);
        }
    }
}

main().finally(() => prisma.$disconnect());
