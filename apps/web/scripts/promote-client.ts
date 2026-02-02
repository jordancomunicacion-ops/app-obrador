
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = process.argv[2];

if (!TARGET_EMAIL) {
    console.error("Please provide an email argument.");
    console.log("Usage: npx tsx scripts/promote-client.ts <email>");
    process.exit(1);
}

async function main() {
    console.log(`Promoting user ${TARGET_EMAIL} to Independent Tenant (Admin)...`);

    const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });

    if (!user) {
        console.error("User not found.");
        process.exit(1);
    }

    const defaultPermissions = [
        'dashboard', 'events', 'tasks', 'menu-planning',
        'products', 'recipes', 'purchasing', 'storage',
        'mise-en-place', 'employees', 'settings'
    ];

    await prisma.user.update({
        where: { id: user.id },
        data: {
            role: 'ADMIN',
            approved: true,
            permissions: defaultPermissions,
            adminId: null, // Critical: Detach from any other admin
            // Ensure they own themselves if we used that logic elsewhere, 
            // but currentOrgId logic relies on ID matching so this is enough.
        }
    });

    console.log(`SUCCESS: User ${user.name} (${user.email}) is now a Tenant Admin.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
