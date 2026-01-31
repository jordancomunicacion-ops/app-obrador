
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orphanSPId = 'cmkyirzfm0001uu5dt3233u3t'; // Vino (1.30)
    const canonicalSPId = 'cmkzrpmyo001fh69ka25xi5me'; // Vino (Dicomar) (1.50)

    console.log(`Merging SupplierProduct ${orphanSPId} into ${canonicalSPId}...`);

    try {
        // 1. Update RecipeItems
        const recipeItems = await prisma.recipeItem.updateMany({
            where: { sourceProductId: orphanSPId },
            data: { sourceProductId: canonicalSPId }
        });
        console.log(`Updated ${recipeItems.count} RecipeItems`);

        // 2. Delete the orphan SupplierProduct
        await prisma.supplierProduct.delete({
            where: { id: orphanSPId }
        });
        console.log(`Deleted orphan SupplierProduct.`);

    } catch (e) {
        console.error("Error during SP merge:", e);
    }
}

main().finally(() => prisma.$disconnect());
