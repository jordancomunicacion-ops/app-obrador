
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Updating Patty recipe yield...");

    const patty = await prisma.recipe.findFirst({
        where: { name: 'Patty' }
    });

    if (patty) {
        await prisma.recipe.update({
            where: { id: patty.id },
            data: {
                yieldQuantity: 1,
                yieldUnit: 'UD'
            }
        });
        console.log("Patty updated: Yield 1 UD.");
    } else {
        console.log("Patty recipe not found.");
    }

    console.log("\nRe-auditing Hamburguesa cost...");
    // We already have the logic in costing.ts, but we'll check the DB state or re-run the audit script
}

main().finally(() => prisma.$disconnect());
