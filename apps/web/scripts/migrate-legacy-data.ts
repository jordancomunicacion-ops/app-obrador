
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MASTER_EMAIL = 'gerencia@sotodelprior.com'; // Adjust if needed

async function main() {
    console.log(`Starting Data Migration for Legacy Data...`);
    console.log(`Target Master Admin: ${MASTER_EMAIL}`);

    const master = await prisma.user.findUnique({ where: { email: MASTER_EMAIL } });

    if (!master) {
        console.error("ERROR: Master user not found!");
        process.exit(1);
    }

    console.log(`Found Master ID: ${master.id}`);

    // Update Tables
    const tables = [
        'event', 'task', 'recipe', 'ingredient',
        'supplier', 'menuService', 'appConfig',
        'storageLocation', 'miseEnPlaceTask'
    ];

    for (const table of tables) {
        // @ts-ignore
        const result = await prisma[table].updateMany({
            where: { ownerId: null },
            data: { ownerId: master.id }
        });
        console.log(`Updated ${table}: ${result.count} records assigned to Master.`);
    } // added closing brace

    console.log("Migration Complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
