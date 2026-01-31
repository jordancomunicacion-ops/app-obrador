
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalculateIngredientPrices(transformation, tx) {
    if (!transformation || !transformation.sourceProduct) return;

    const sourcePrice = transformation.sourceProduct.price || 0;
    const testQty = transformation.testQuantity;

    const totalInputCost = sourcePrice * testQty;

    let totalWeightedMass = 0;
    for (const output of transformation.outputs) {
        if (output.weight > 0) {
            totalWeightedMass += output.weight * (output.costAllocation || 1);
        }
    }

    if (totalWeightedMass === 0) return;

    const costPerWeightedUnit = totalInputCost / totalWeightedMass;

    for (const output of transformation.outputs) {
        if (output.weight > 0) {
            const newPricePerUnit = costPerWeightedUnit * (output.costAllocation || 1);
            console.log(`Updating Ingredient ${output.ingredient.name} (ID: ${output.ingredientId}): Old Price: ${output.ingredient.pricePerUnit} -> New Price: ${newPricePerUnit}`);

            await tx.ingredient.update({
                where: { id: output.ingredientId },
                data: {
                    pricePerUnit: newPricePerUnit
                }
            });
        }
    }
}

async function main() {
    console.log('Starting Price Recalculation...');

    // Fetch all transformations with their data
    const transformations = await prisma.transformation.findMany({
        include: {
            sourceProduct: true,
            outputs: {
                include: { ingredient: true }
            }
        }
    });

    console.log(`Found ${transformations.length} transformations.`);

    for (const t of transformations) {
        console.log(`Processing Transformation: ${t.name} (ID: ${t.id})`);
        await recalculateIngredientPrices(t, prisma);
    }

    console.log('Recalculation Complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
