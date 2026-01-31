
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tx = await prisma.transformation.findMany({
        where: { id: { in: ['cmkzre4oe0002h69khz8bneft', 'cmkxvyp7y000su1r0qthanpo4'] } },
        include: {
            outputs: { include: { ingredient: true } },
            sourceProduct: true
        }
    });

    console.log(JSON.stringify(tx, null, 2));
}

main().finally(() => prisma.$disconnect());
