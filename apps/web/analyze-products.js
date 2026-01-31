
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing Master Products and Supplier Products...");

    const mps = await prisma.masterProduct.findMany({
        include: {
            supplierProducts: {
                include: { ingredient: true }
            }
        }
    });

    console.log("\n--- MASTER PRODUCTS AND THEIR LINKS ---");
    mps.forEach(mp => {
        console.log(`[Master] ${mp.name} (${mp.id})`);
        if (mp.supplierProducts.length === 0) {
            console.log("  - NO SUPPLIER PRODUCTS");
        }
        mp.supplierProducts.forEach(sp => {
            console.log(`  - [Supplier] ${sp.name} (${sp.id}) | Price: ${sp.price} | Ing: ${sp.ingredient?.name || 'NONE'}`);
        });
    });

    const spsNoMaster = await prisma.supplierProduct.findMany({
        where: { masterProductId: null },
        include: { ingredient: true }
    });

    console.log("\n--- UNLINKED SUPPLIER PRODUCTS (No Master Product) ---");
    spsNoMaster.forEach(sp => {
        console.log(`  - [Supplier] ${sp.name} (${sp.id}) | Price: ${sp.price} | Ing: ${sp.ingredient?.name || 'NONE'}`);
    });

    const ingredientsNoMasterCount = await prisma.ingredient.count({
        where: { supplierProducts: { none: { NOT: { masterProductId: null } } } }
    });
    console.log(`\nIngredients not linked to any MasterProduct (indirectly): ${ingredientsNoMasterCount}`);
}

main().finally(() => prisma.$disconnect());
