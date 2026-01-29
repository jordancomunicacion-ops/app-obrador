
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Ingredient Deduplication...');

    // 1. Fetch all ingredients
    const ingredients = await prisma.ingredient.findMany({
        orderBy: { createdAt: 'asc' } // Oldest first
    });

    console.log(`Total ingredients found: ${ingredients.length}`);

    // 2. Group by normalized name
    const grouped = new Map<string, typeof ingredients>();

    for (const ing of ingredients) {
        const name = ing.name.trim().toLowerCase();
        if (!grouped.has(name)) {
            grouped.set(name, []);
        }
        grouped.get(name)?.push(ing);
    }

    let mergedCount = 0;

    // 3. Process duplicates
    for (const [name, group] of grouped) {
        if (group.length > 1) {
            console.log(`Found ${group.length} duplicates for "${name}"`);

            const survivor = group[0];
            const victims = group.slice(1);

            for (const victim of victims) {
                console.log(`  -> Merging "${victim.name}" (${victim.id}) into "${survivor.name}" (${survivor.id})...`);

                try {
                    // Update Recipe Items
                    const recipeItems = await prisma.recipeItem.updateMany({
                        where: { ingredientId: victim.id },
                        data: { ingredientId: survivor.id }
                    });
                    if (recipeItems.count > 0) console.log(`     Updated ${recipeItems.count} RecipeItems`);

                    // Update Recipe Steps
                    const recipeSteps = await prisma.recipeStep.updateMany({
                        where: { ingredientId: victim.id },
                        data: { ingredientId: survivor.id }
                    });
                    if (recipeSteps.count > 0) console.log(`     Updated ${recipeSteps.count} RecipeSteps`);

                    // Update Transformation Outputs
                    const transOutputs = await prisma.transformationOutput.updateMany({
                        where: { ingredientId: victim.id },
                        data: { ingredientId: survivor.id }
                    });
                    if (transOutputs.count > 0) console.log(`     Updated ${transOutputs.count} TransformationOutputs`);

                    // Update Purchase Formats
                    const purchFormats = await prisma.purchaseFormat.updateMany({
                        where: { ingredientId: victim.id },
                        data: { ingredientId: survivor.id }
                    });
                    if (purchFormats.count > 0) console.log(`     Updated ${purchFormats.count} PurchaseFormats`);

                    // Finally, delete the victim
                    await prisma.ingredient.delete({
                        where: { id: victim.id }
                    });
                    console.log(`     Deleted victim ingredient.`);

                    mergedCount++;

                } catch (e) {
                    console.error(`     ERROR merging ${victim.id}:`, e);
                }
            }
        }
    }

    console.log(`\nDeduplication complete.`);
    console.log(`Merged and removed ${mergedCount} duplicate ingredients.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
