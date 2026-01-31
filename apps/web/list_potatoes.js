
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Ingredients matching "Patata" ---');
    const ingredients = await prisma.ingredient.findMany({
        where: {
            name: { contains: 'Patata', mode: 'insensitive' }
        }
    });

    if (ingredients.length === 0) {
        console.log('No ingredients found.');
    } else {
        console.table(ingredients.map(i => ({
            id: i.id,
            name: i.name,
            price: i.pricePerUnit,
            unit: i.pricingUnit
        })));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
