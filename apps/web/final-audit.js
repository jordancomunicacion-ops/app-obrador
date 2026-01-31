
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Deep Audit...");

    // 1. Get raw ingredients that SHOULD be filtered
    const transformedSP = await prisma.supplierProduct.findMany({
        where: { transformations: { some: {} } },
        select: { ingredientId: true, name: true }
    });

    const excludedIds = new Set(transformedSP.map(p => p.ingredientId).filter(Boolean));
    console.log(`Transformed SupplierProducts found: ${transformedSP.length}`);
    transformedSP.forEach(sp => {
        console.log(`- SP: ${sp.name} -> IngID: ${sp.ingredientId}`);
    });

    // 2. Check "Solomillo de vaca" Ingredient
    const solomillo = await prisma.ingredient.findFirst({
        where: { name: 'Solomillo de vaca' }
    });

    if (solomillo) {
        console.log(`\nIngredient: ${solomillo.name} (ID: ${solomillo.id})`);
        const filtered = excludedIds.has(solomillo.id);
        console.log(`Is in excluded set? ${filtered}`);
        if (filtered) {
            console.log("✅ VERIFIED: Solomillo de vaca will be HIDDEN from raw list.");
        } else {
            console.log("❌ ERROR: Solomillo de vaca will be VISIBLE in raw list.");
        }
    }

    // 3. Check "Patatas" Ingredient
    const patatas = await prisma.ingredient.findFirst({
        where: { name: 'Patatas' }
    });
    if (patatas) {
        console.log(`\nIngredient: ${patatas.name} (ID: ${patatas.id})`);
        const filtered = excludedIds.has(patatas.id);
        console.log(`Is in excluded set? ${filtered}`);
        if (filtered) {
            console.log("✅ VERIFIED: Patatas will be HIDDEN from raw list.");
        } else {
            console.log("❌ ERROR: Patatas will be VISIBLE in raw list.");
        }
    }

    // 4. Check Yield Ingredients (should be visible in second list)
    const yieldIngs = await prisma.ingredient.findMany({
        where: { name: { in: ['Centro', 'Punta', 'Restos', 'Patata limpia'] } },
        include: { transformationOutputs: true }
    });
    console.log("\nYield Ingredients (Outputs):");
    yieldIngs.forEach(ing => {
        console.log(`- ${ing.name} (ID: ${ing.id}) | Outputs: ${ing.transformationOutputs.length}`);
    });
}

main().finally(() => prisma.$disconnect());
