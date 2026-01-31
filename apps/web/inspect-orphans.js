
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ids = [
        'cmkx92af20007u1r0sqcafnkl', // Punta
        'cmkx92afh000au1r0gsir3hbm', // Restos
        'cmkylp47w000gekj52wp33qxi', // Patata pelada
        'cmkylp489000jekj5j7vft01t'  // Piel de patata
    ];

    console.log("Inspecting orphaned ingredients...");

    for (const id of ids) {
        const ing = await prisma.ingredient.findUnique({
            where: { id },
            include: {
                supplierProducts: true,
                recipeItems: true,
                recipeStepIngredients: true,
                recipeSteps: true,
                purchaseFormats: true,
                transformationOutputs: true
            }
        });

        if (ing) {
            console.log(`\nIngredient: ${ing.name} (${ing.id})`);
            console.log(`  SPs: ${ing.supplierProducts.length}`);
            console.log(`  RecipeItems: ${ing.recipeItems.length}`);
            console.log(`  StepIngs: ${ing.recipeStepIngredients.length}`);
            console.log(`  Steps: ${ing.recipeSteps.length}`);
            console.log(`  PurchFormats: ${ing.purchaseFormats.length}`);
            console.log(`  TransOutputs: ${ing.transformationOutputs.length}`);
        } else {
            console.log(`\nIngredient ${id} not found.`);
        }
    }
}

main().finally(() => prisma.$disconnect());
