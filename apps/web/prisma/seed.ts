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

        // 2. Categories
        const categories = ['Principal', 'Entrante', 'Postre', 'Salsa', 'Guarnicion'];
        for (const catName of categories) {
            const exists = await prisma.recipeCategory.findUnique({ where: { name: catName } });
            if (!exists) {
                await prisma.recipeCategory.create({ data: { name: catName } });
                console.log(`Created Category: ${catName}`);
            }
        }

        // 3. Packaging
        const packaging = ['Tupper', 'Bolsa Vacio', 'Caja', 'Gastronorm'];
        for (const packName of packaging) {
            const exists = await prisma.recipePackaging.findUnique({ where: { name: packName } });
            if (!exists) {
                await prisma.recipePackaging.create({ data: { name: packName } });
                console.log(`Created Packaging: ${packName}`);
            }
        }
    } catch (e) {
        console.error('Seed Error:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
