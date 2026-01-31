
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeIngredients(victimId, canonicalId) {
    if (!victimId || !canonicalId || victimId === canonicalId) return;
    console.log(`  Merging Ingredient ${victimId} into ${canonicalId}...`);

    // Update relations
    const ri = await prisma.recipeItem.updateMany({ where: { ingredientId: victimId }, data: { ingredientId: canonicalId } });
    const rsi = await prisma.recipeStepIngredient.updateMany({ where: { ingredientId: victimId }, data: { ingredientId: canonicalId } });
    const rs = await prisma.recipeStep.updateMany({ where: { ingredientId: victimId }, data: { ingredientId: canonicalId } });
    const pf = await prisma.purchaseFormat.updateMany({ where: { ingredientId: victimId }, data: { ingredientId: canonicalId } });
    const to = await prisma.transformationOutput.updateMany({ where: { ingredientId: victimId }, data: { ingredientId: canonicalId } });

    console.log(`    Updated: ${ri.count} RecipeItems, ${rsi.count} StepIngredients, ${pf.count} PurchaseFormats`);

    // Delete orphan ingredient if it has no more SP links
    const spCount = await prisma.supplierProduct.count({ where: { ingredientId: victimId } });
    if (spCount === 0) {
        await prisma.ingredient.delete({ where: { id: victimId } }).catch(e => console.log("    (Could not delete ingredient, might still have relations)"));
    }
}

async function mergeSupplierProducts(victimId, canonicalId) {
    if (!victimId || !canonicalId || victimId === canonicalId) return;
    console.log(`  Merging SupplierProduct ${victimId} into ${canonicalId}...`);

    const ri = await prisma.recipeItem.updateMany({ where: { sourceProductId: victimId }, data: { sourceProductId: canonicalId } });
    const t = await prisma.transformation.updateMany({ where: { sourceProductId: victimId }, data: { sourceProductId: canonicalId } });

    console.log(`    Updated: ${ri.count} RecipeItems, ${t.count} Transformations`);

    await prisma.supplierProduct.delete({ where: { id: victimId } }).catch(e => console.log("    (Could not delete SP)"));
}

async function main() {
    console.log("Starting full data cleanup...");

    // 1. DELETE TOTALLY UNUSED ORPHANS
    const trashOrphans = [
        'cmkx92af20007u1r0sqcafnkl', // Punta
        'cmkx92afh000au1r0gsir3hbm', // Restos
        'cmkylp47w000gekj52wp33qxi', // Patata pelada
        'cmkylp489000jekj5j7vft01t'  // Piel de patata
    ];
    for (const id of trashOrphans) {
        console.log(`Deleting unused orphan ${id}...`);
        await prisma.ingredient.delete({ where: { id } }).catch(e => { });
    }

    // 2. CONSOLIDATE SOLOMILLO
    // Victim SP: cmkx8ux0w0000u1r0far6eb6j (Solomillo vaca - no master)
    // Canonical Master: cmkzq0n260001ezjmuyy8w3bi (Solomillo de vaca)
    // We'll link the orphan SP to the Master first if we wanted to keep it, 
    // but better to merge into one of the existing variants (ALMAMEAT or MAKRO).
    // Let's merge into ALMAMEAT (18€ matches).
    console.log("Consolidating Solomillo...");
    const solomilloVictimSP = 'cmkx8ux0w0000u1r0far6eb6j';
    const solomilloCanonicalSP = 'cmkzq0n2m0004ezjmtvp09a8s'; // ALMAMEAT
    const solomilloVictimIng = (await prisma.supplierProduct.findUnique({ where: { id: solomilloVictimSP } }))?.ingredientId;
    const solomilloCanonicalIng = (await prisma.supplierProduct.findUnique({ where: { id: solomilloCanonicalSP } }))?.ingredientId;

    await mergeIngredients(solomilloVictimIng, solomilloCanonicalIng);
    await mergeSupplierProducts(solomilloVictimSP, solomilloCanonicalSP);

    // 3. CONSOLIDATE PAN BRIOCHE
    console.log("Consolidating Pan Brioche...");
    const panVictimSP = 'cmkyim9xe0000uu5dxl7x1esl';
    const panCanonicalSP = 'cmkzrwe1j001lh69ka31wdm0o'; // Juanito Baker
    const panVictimIng = (await prisma.supplierProduct.findUnique({ where: { id: panVictimSP } }))?.ingredientId;
    const panCanonicalIng = (await prisma.supplierProduct.findUnique({ where: { id: panCanonicalSP } }))?.ingredientId;

    await mergeIngredients(panVictimIng, panCanonicalIng);
    await mergeSupplierProducts(panVictimSP, panCanonicalSP);

    // 4. CONSOLIDATE PATATAS
    console.log("Consolidating Patatas...");
    const patatasVictimSP = 'cmkyiukoc0002uu5dxx1mo4bn';
    const patatasCanonicalSP = 'cmkzrkfqw000dh69kg59jy8fq'; // Makro (0.98€ matches)
    const patatasVictimIng = (await prisma.supplierProduct.findUnique({ where: { id: patatasVictimSP } }))?.ingredientId;
    const patatasCanonicalIng = (await prisma.supplierProduct.findUnique({ where: { id: patatasCanonicalSP } }))?.ingredientId;

    await mergeIngredients(patatasVictimIng, patatasCanonicalIng);
    await mergeSupplierProducts(patatasVictimSP, patatasCanonicalSP);

    console.log("\nCleanup complete.");
}

main().finally(() => prisma.$disconnect());
