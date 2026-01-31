
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orphanId = 'cmkymfrqd000wekj5itmcekyw'; // Vino (1.30)
    const canonicalId = 'cmkzrpmyq001gh69k00qhz7zu'; // Vino (Dicomar) (1.50)

    console.log(`Merging ${orphanId} into ${canonicalId}...`);

    try {
        // 1. Update RecipeItems
        const recipeItems = await prisma.recipeItem.updateMany({
            where: { ingredientId: orphanId },
            data: { ingredientId: canonicalId }
        });
        console.log(`Updated ${recipeItems.count} RecipeItems`);

        // 2. Update RecipeStepIngredients (The new model we just introduced!)
        const stepIngredients = await prisma.recipeStepIngredient.updateMany({
            where: { ingredientId: orphanId },
            data: { ingredientId: canonicalId }
        });
        console.log(`Updated ${stepIngredients.count} RecipeStepIngredients`);

        // 3. Update RecipeSteps (Legacy field if still used)
        const recipeSteps = await prisma.recipeStep.updateMany({
            where: { ingredientId: orphanId },
            data: { ingredientId: canonicalId }
        });
        console.log(`Updated ${recipeSteps.count} RecipeSteps`);

        // 4. Update SupplierProducts
        const supplierProducts = await prisma.supplierProduct.updateMany({
            where: { ingredientId: orphanId },
            data: { ingredientId: canonicalId }
        });
        console.log(`Updated ${supplierProducts.count} SupplierProducts`);

        // 5. Delete the orphan
        await prisma.ingredient.delete({
            where: { id: orphanId }
        });
        console.log(`Deleted orphan ingredient.`);

    } catch (e) {
        console.error("Error during merge:", e);
    }
}

main().finally(() => prisma.$disconnect());
