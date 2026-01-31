
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking recipes...");
    const recipes = await prisma.recipe.findMany({
        where: { name: { contains: 'vino', mode: 'insensitive' } },
        include: {
            items: {
                include: {
                    ingredient: true,
                    sourceProduct: true,
                    subRecipe: true
                }
            }
        }
    });

    for (const r of recipes) {
        console.log(`Recipe: ${r.name} ID: ${r.id}`);
        console.log(`Items: ${r.items.length}`);
        for (const it of r.items) {
            console.log(`  - Type: ${it.type} Qty: ${it.quantityGross} Unit: ${it.unit}`);
            if (it.ingredient) {
                console.log(`    Ing: ${it.ingredient.name} Price: ${it.ingredient.pricePerUnit} Unit: ${it.ingredient.pricingUnit}`);
            }
            if (it.subRecipe) {
                console.log(`    Sub: ${it.subRecipe.name}`);
            }
            if (it.sourceProduct) {
                console.log(`    Src: ${it.sourceProduct.name} Price: ${it.sourceProduct.price} Unit: ${it.sourceProduct.unit}`);
            }
        }
    }
}

main().finally(() => prisma.$disconnect());
