
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'gerencia@sotodelprior.com';
    console.log(`Checking user: ${email}...`);

    const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } } // Case insensitive check
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('Current User:', user);

    if (user.role !== 'ADMIN' || user.adminId !== null) {
        console.log('Updating user to ADMIN and removing adminId...');
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                role: 'ADMIN',
                adminId: null,
                approved: true
            }
        });
        console.log('User updated:', updated);
    } else {
        console.log('User is already configured correctly.');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
