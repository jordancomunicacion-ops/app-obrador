
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking MasterProduct and Ingredient links for 'Vino'...");

    const masterProducts = await prisma.masterProduct.findMany({
        where: { name: { contains: 'Vino', mode: 'insensitive' } },
        include: {
            supplierProducts: {
                include: { ingredient: true }
            }
        }
    });

    for (const mp of masterProducts) {
        console.log(`MasterProduct: ${mp.name} (ID: ${mp.id})`);
        for (const sp of mp.supplierProducts) {
            console.log(`  SupplierProduct: ${sp.name} (ID: ${sp.id}) - Price: ${sp.price}`);
            console.log(`    Linked Ingredient: ${sp.ingredient?.name} (ID: ${sp.ingredient?.id}) - Price: ${sp.ingredient?.pricePerUnit}`);
        }
    }

    const allIngredients = await prisma.ingredient.findMany({
        where: { name: { contains: 'Vino', mode: 'insensitive' } }
    });
    console.log("\nAll Ingredients with 'Vino' in name:");
    for (const ing of allIngredients) {
        console.log(`- ${ing.name} (ID: ${ing.id}) - Price: ${ing.pricePerUnit}`);
    }
}

main().finally(() => prisma.$disconnect());
