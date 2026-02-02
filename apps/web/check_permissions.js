
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            name: {
                contains: 'Jose'
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
            approved: true
        }
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
