
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'gerencia@sotodelprior.com';

async function main() {
    console.log(`Checking account for ${EMAIL}...`);

    let user = await prisma.user.findUnique({ where: { email: EMAIL } });

    if (!user) {
        console.log("User not found. Creating Gerencia user...");
        // You might want to ask for password, but for now assuming it exists or handled manually.
        // Actually, if it doesn't exist, we can't create it without a password.
        console.error("ERROR: Gerencia user does NOT exist in the database. Please register it first.");
        return;
    }

    console.log(`User found. Current Role: ${user.role}, Permissions: ${user.permissions.length}`);

    const defaultPermissions = [
        'dashboard', 'events', 'tasks', 'menu-planning',
        'products', 'recipes', 'purchasing', 'storage',
        'mise-en-place', 'employees', 'settings'
    ];

    // Update to ensure it's a proper Admin/Tenant
    await prisma.user.update({
        where: { id: user.id },
        data: {
            role: 'ADMIN',
            approved: true,
            permissions: defaultPermissions,
            // adminId should be null for the Master
            adminId: null
        }
    });

    console.log("SUCCESS: Gerencia is confirmed as an Independent ADMIN with full permissions.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
