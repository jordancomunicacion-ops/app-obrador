
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log(`Total users: ${count}`);
    const users = await prisma.user.findMany({
        take: 50
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
