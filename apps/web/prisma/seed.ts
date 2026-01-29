import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seed starting...');
    try {
        const email = 'gerencia@sotodelprior.com';
        const password = '123456';
        const name = 'Gerencia';

        // Explicitly using env var from process if needed, but Prisma Client should pick it up from .env
        // or we can pass it manually for debugging.
        console.log('Database URL:', process.env.DATABASE_URL);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    role: 'ADMIN', // Ensure this matches string type in schema since we removed enums
                },
            });
            console.log(`Created user: ${email} with password: ${password}`);
        } else {
            console.log(`User ${email} already exists.`);
        }
    } catch (e) {
        console.error('Seed Error:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
