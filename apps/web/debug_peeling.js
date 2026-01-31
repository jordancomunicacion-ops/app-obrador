
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Potato Peeling Transformation ---');

    // Find transformation for peeling potatoes
    const transformations = await prisma.transformation.findMany({
        where: {
            name: { contains: 'Pelar', mode: 'insensitive' }
        },
        include: {
            sourceProduct: true,
            outputs: {
                include: { ingredient: true }
            }
        }
    });

    if (transformations.length === 0) {
        console.log('No transformation found for "Pelar".');
        return;
    }

    for (const t of transformations) {
        console.log(`\nTransformation: ${t.name} (ID: ${t.id})`);
        console.log(`Source Product: ${t.sourceProduct.name} | Price: ${t.sourceProduct.price} €/${t.sourceProduct.unit}`);
        console.log(`Test Quantity: ${t.testQuantity}`);

        const inputCost = t.sourceProduct.price * t.testQuantity;
        console.log(`Total Input Cost: ${inputCost.toFixed(4)} €`);

        let totalWeightedMass = 0;
        t.outputs.forEach(o => totalWeightedMass += o.weight * (o.costAllocation || 0));
        console.log(`Total Weighted Mass (Inputs for recalc): ${totalWeightedMass}`);

        console.log('Outputs:');
        for (const out of t.outputs) {
            console.log(`  - Ingredient: ${out.ingredient.name}`);
            console.log(`    Weight: ${out.weight}`);
            console.log(`    Cost Allocation: ${out.costAllocation}`);
            console.log(`    Current Price/Unit: ${out.ingredient.pricePerUnit} €/${out.ingredient.pricingUnit}`);

            // Manual Check calculation
            const expectedPrice = totalWeightedMass > 0 ? (inputCost / totalWeightedMass) * (out.costAllocation || 0) : 0;
            console.log(`    Expected Price/Unit: ${expectedPrice.toFixed(4)}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
