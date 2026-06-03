
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

    // Gerencia es el PROPIETARIO DE PLATAFORMA: rol SUPERADMIN (cross-tenant), NO
    // un tenant más. Así deja de aparecer como cuenta cliente en el selector y ve
    // todo a nivel plataforma (igual que en CRM/reservas).
    await prisma.user.update({
        where: { id: user.id },
        data: {
            role: 'SUPERADMIN',
            approved: true,
            permissions: defaultPermissions,
            // adminId null: la plataforma no cuelga de ninguna cuenta.
            adminId: null
        }
    });

    console.log("SUCCESS: Gerencia is confirmed as SUPERADMIN (platform owner, cross-tenant).");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
