import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = 'cmkzq0n2m0004ezjmtvp09a8s';

    console.log(`Checking ID: ${id}`);

    const master = await prisma.masterProduct.findUnique({ where: { id } });
    const supplier = await prisma.supplierProduct.findUnique({ where: { id } });

    console.log('MasterProduct match:', master ? master.name : 'NONE');
    console.log('SupplierProduct match:', supplier ? supplier.name : 'NONE');

    if (supplier) {
        console.log('Parent MasterProduct ID:', supplier.masterProductId);
        if (supplier.masterProductId) {
            const parent = await prisma.masterProduct.findUnique({ where: { id: supplier.masterProductId } });
            console.log('Parent MasterProduct Name:', parent ? parent.name : 'NOT FOUND');
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
