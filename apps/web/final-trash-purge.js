
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ids = [
        'cmkx92af20007u1r0sqcafnkl', // Punta
        'cmkx92afh000au1r0gsir3hbm', // Restos
        'cmkylp47w000gekj52wp33qxi', // Patata pelada
        'cmkylp489000jekj5j7vft01t'  // Piel de patata
    ];

    console.log("Purging trash orphans and their relations...");

    for (const id of ids) {
        console.log(`Processing ${id}...`);

        // 1. Delete transformation outputs linking to this ingredient
        const to = await prisma.transformationOutput.deleteMany({
            where: { ingredientId: id }
        });
        if (to.count > 0) console.log(`  Deleted ${to.count} TransformationOutputs`);

        // 2. Delete the ingredient
        try {
            await prisma.ingredient.delete({ where: { id } });
            console.log(`  Deleted Ingredient.`);
        } catch (e) {
            console.error(`  Failed to delete ingredient ${id}: ${e.message}`);
        }
    }

    console.log("\nTrash purge complete.");
}

main().finally(() => prisma.$disconnect());
