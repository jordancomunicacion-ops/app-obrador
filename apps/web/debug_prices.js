
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ingredients = await prisma.ingredient.findMany({
        where: {
            OR: [
                { name: { contains: 'Patata' } },
                { name: { contains: 'PATATA' } }
            ]
        }
    });

    console.log('Ingredients found:');
    ingredients.forEach(i => {
        console.log(`ID: ${i.id}, Name: ${i.name}, Price: ${i.pricePerUnit}, Unit: ${i.unit}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
