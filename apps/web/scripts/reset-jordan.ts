
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const EMAIL = 'jordan.comunicacion@gmail.com'; // Exact email
const PASSWORD = 'password123';
const MASTER_EMAIL = 'gerencia@sotodelprior.com';

async function main() {
    console.log(`Resetting/Creating user: ${EMAIL}`);

    const existing = await prisma.user.findFirst({
        where: { email: { equals: EMAIL, mode: 'insensitive' } }
    });

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const defaultPermissions = ['dashboard']; // Basic permission

    if (existing) {
        console.log(`User exists (ID: ${existing.id}). Updating password and approval...`);
        await prisma.user.update({
            where: { id: existing.id },
            data: {
                password: hashedPassword,
                approved: true,
                role: 'USER', // Ensure it's a worker? Or Admin? User said "trabajador".
                // If it's a worker, we ensure it's approved.
            }
        });
        console.log("User UPDATED. Password is now: password123");
    } else {
        console.log("User does NOT exist. Creating new...");

        let adminId = null;
        const master = await prisma.user.findUnique({ where: { email: MASTER_EMAIL } });
        if (master) adminId = master.id;

        await prisma.user.create({
            data: {
                name: "Jordan Comunicacion",
                email: EMAIL,
                password: hashedPassword,
                role: "USER",
                approved: true,
                adminId: adminId,
                permissions: defaultPermissions
            }
        });
        console.log("User CREATED. Password is: password123");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
