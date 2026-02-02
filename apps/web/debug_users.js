
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            role: true,
            adminId: true,
        }
    });
    console.log("--- USERS ---");
    users.forEach(u => {
        console.log(`User: ${u.name} | ID: ${u.id} | Role: ${u.role} | AdminID: ${u.adminId}`);
    });

    // Check counts for each user as if they were logged in
    console.log("\n--- SIMULATED COUNTS ---");
    for (const u of users) {
        if (u.role === 'ADMIN' || u.role === 'GERENCIA') {
            const count = await prisma.user.count({
                where: {
                    OR: [
                        { adminId: u.id },
                        { id: u.id }
                    ]
                }
            });
            console.log(`For Admin ${u.name} (${u.id}): Team Count = ${count}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
