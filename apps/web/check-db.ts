import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.recipeCategory.findMany();
    const packaging = await prisma.recipePackaging.findMany();

    console.log('Categories:', JSON.stringify(categories, null, 2));
    console.log('\nPackaging:', JSON.stringify(packaging, null, 2));
}

main().finally(() => prisma.$disconnect());
