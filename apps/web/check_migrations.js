const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const migrations = await prisma.$queryRaw`SELECT migration_name, rolled_back_at, finished_at FROM _prisma_migrations;`;
        console.log('Applied migrations:', migrations);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
