
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Restoring Solomillo yield ingredients...");

    const transIds = ['cmkzre4oe0002h69khz8bneft', 'cmkxvyp7y000su1r0qthanpo4'];
    const centroId = 'cmkx92ael0004u1r02vu3atuo';

    // 1. Recreate/Rename Punta and Restos
    // I'll create them with specific names to be safe
    const punta = await prisma.ingredient.create({
        data: {
            name: 'Punta',
            pricingUnit: 'KG',
            pricePerUnit: 18.00, // Default to source price or lower
            yieldPercent: 100
        }
    });
    console.log(`Created Punta: ${punta.id}`);

    const restos = await prisma.ingredient.create({
        data: {
            name: 'Restos',
            pricingUnit: 'KG',
            pricePerUnit: 12.00, // Lower price for scraps
            yieldPercent: 100
        }
    });
    console.log(`Created Restos: ${restos.id}`);

    // Rename Centro to be more explicit if needed, but UI prefixes it.
    // Let's keep it as is for now to avoid breaking existing recipes.

    // 2. Link to Transformations
    // We'll use 0.4kg for Punta and 0.3kg for Restos (Total 0.7kg)
    // Centro is already there with 1.8kg (Total 2.5kg / 2.7kg)
    for (const tid of transIds) {
        console.log(`Linking to transformation ${tid}...`);

        await prisma.transformationOutput.create({
            data: {
                transformationId: tid,
                ingredientId: punta.id,
                weight: 0.4,
                percentage: (0.4 / 2.7) * 100,
                costAllocation: 1.0 // 1x cost
            }
        });

        await prisma.transformationOutput.create({
            data: {
                transformationId: tid,
                ingredientId: restos.id,
                weight: 0.3,
                percentage: (0.3 / 2.7) * 100,
                costAllocation: 0.7 // Lower cost allocation for scraps
            }
        });
    }

    console.log("Restoration complete.");
}

main().finally(() => prisma.$disconnect());
