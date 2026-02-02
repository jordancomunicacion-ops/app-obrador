
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Debugging user: jordan...");

    // Fuzzy search for "jordan"
    const users = await prisma.user.findMany({
        where: {
            email: { contains: 'jordan', mode: 'insensitive' }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            approved: true,
            adminId: true,
            // We can't see the password, but we can see if it exists
            password: true
        }
    });

    if (users.length === 0) {
        console.log("NO USER FOUND containing 'jordan'.");
        console.log("Listing ALL emails in DB to check for typos:");
        const allUsers = await prisma.user.findMany({
            select: { email: true }
        });
        allUsers.forEach(u => console.log(`- ${u.email}`));
    } else {
        console.log(`Found ${users.length} user(s):`);
        users.forEach(u => {
            console.log(JSON.stringify({
                ...u,
                password: u.password ? "[HASHED_VALUE_EXISTS]" : "[MISSING]",
            }, null, 2));
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
