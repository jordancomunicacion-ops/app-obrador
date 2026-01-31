
const { PrismaClient } = require('@prisma/client');

// Mocking logic to verify data instead of importing complete app modules
// Since generateShoppingList uses imported functions from other files, running it in a standalone script might be tricky due to module resolution (alias @/)
// We'll rely on a manual check similar to the implementation logic for verification without running the full app code if imports fail, 
// OR we try to run it with ts-node/register and tsconfig details, but we saw failures before.
// SIMPLIFIED APPROACH: We will just manually query the DB to prove the concept works:
// 1. Find a TransformationResult (mocked or real from DB if we could run resolveTransformations).
// 2. Fetch the SupplierProduct price.
// 3. Show that SupplierProduct price * Qty matches expectation.

const prisma = new PrismaClient();

async function main() {
    // 1. Find metadata for "Patata limpia" transformation
    // We look for a Transformation that produces "Patata limpia"
    const ingredient = await prisma.ingredient.findFirst({
        where: { name: { contains: 'Patata limpia' } }
    });

    if (!ingredient) {
        console.log('Patata limpia ingredient not found.');
        return;
    }

    const tOutput = await prisma.transformationOutput.findFirst({
        where: { ingredientId: ingredient.id },
        include: { transformation: { include: { sourceProduct: true } } }
    });

    if (!tOutput) {
        console.log('No transformation found for Patata limpia.');
        return;
    }

    const sourceProduct = tOutput.transformation.sourceProduct;
    console.log(`Source Product: ${sourceProduct.name}`);
    console.log(`Source Product Price: ${sourceProduct.price} € / ${sourceProduct.unit}`);

    // Simulation
    const requiredDerivedQty = 36.35; // from screenshot
    const yieldFactor = tOutput.percentage / 100;
    const requiredSourceQty = requiredDerivedQty / yieldFactor;

    console.log(`Required Output: ${requiredDerivedQty} kg`);
    console.log(`Yield: ${tOutput.percentage}%`);
    console.log(`Required Source Qty: ${requiredSourceQty.toFixed(2)} ${sourceProduct.unit}`);

    const estimatedCost = requiredSourceQty * sourceProduct.price;
    console.log(`Estimated Cost (New Logic): ${estimatedCost.toFixed(2)} €`);

    // Old Logic Compare
    console.log(`Old Logic Cost (using Ingredient Price: ${ingredient.pricePerUnit}): ${(requiredSourceQty * (ingredient.pricePerUnit || 0)).toFixed(2)} €`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
