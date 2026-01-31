
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Searching for Solomillo transformations...");

    // Find Solomillo SupplierProducts
    const solomilloSPs = await prisma.supplierProduct.findMany({
        where: { name: { contains: 'Solomillo', mode: 'insensitive' } },
        include: { transformations: true }
    });

    for (const sp of solomilloSPs) {
        console.log(`SupplierProduct: ${sp.name} (${sp.id})`);
        for (const trans of sp.transformations) {
            console.log(`  Transformation: ${trans.name} (${trans.id})`);
        }
    }

    // Find MasterProduct for Solomillo
    const solomilloMP = await prisma.masterProduct.findFirst({
        where: { name: { contains: 'Solomillo', mode: 'insensitive' } }
    });
    console.log(`\nMasterProduct: ${solomilloMP?.name} (${solomilloMP?.id})`);
}

main().finally(() => prisma.$disconnect());
