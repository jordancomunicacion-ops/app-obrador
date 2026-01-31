
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Purging unused orphaned ingredients...");

    const ingredients = await prisma.ingredient.findMany({
        include: {
            supplierProducts: true,
            recipeItems: true,
            recipeStepIngredients: true,
            recipeSteps: true,
            purchaseFormats: true,
            transformationOutputs: true
        }
    });

    let deletedCount = 0;
    for (const ing of ingredients) {
        const totalLinks =
            ing.supplierProducts.length +
            ing.recipeItems.length +
            ing.recipeStepIngredients.length +
            ing.recipeSteps.length +
            ing.purchaseFormats.length +
            ing.transformationOutputs.length;

        if (totalLinks === 0) {
            console.log(`Deleting unused ingredient: ${ing.name} (${ing.id})`);
            try {
                await prisma.ingredient.delete({ where: { id: ing.id } });
                deletedCount++;
            } catch (e) {
                console.error(`  Error deleting ${ing.name}: ${e.message}`);
            }
        }
    }

    console.log(`\nPurge complete. Deleted ${deletedCount} unused ingredients.`);
}

main().finally(() => prisma.$disconnect());
