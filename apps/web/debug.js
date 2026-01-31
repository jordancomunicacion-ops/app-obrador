const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = 'cmkzq0n2m0004ezjmtvp09a8s';
    console.log('--- DB CHECK ---');
    console.log('ID:', id);

    const m = await prisma.masterProduct.findUnique({ where: { id } });
    console.log('MasterProduct:', m ? m.name : 'NOT FOUND');

    const s = await prisma.supplierProduct.findUnique({
        where: { id },
        include: { masterProduct: true }
    });
    console.log('SupplierProduct:', s ? s.name : 'NOT FOUND');
    if (s) {
        console.log('SupplierProduct.masterProductId:', s.masterProductId);
        console.log('Linked MasterProduct Name:', s.masterProduct ? s.masterProduct.name : 'NULL');
    }
}

main().finally(() => prisma.$disconnect());
