
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const recipes = await prisma.recipe.findMany({
        where: {
            name: { contains: 'Hamburguesa', mode: 'insensitive' }
        },
        include: {
            items: {
                include: { ingredient: true }
            }
        }
    });

    console.log(`Found ${recipes.length} recipes matching 'Hamburguesa'`);

    for (const r of recipes) {
        console.log(`\nRecipe: ${r.name} (ID: ${r.id})`);
        r.items.forEach(item => {
            if (item.ingredient) {
                console.log(` - Ingredient: ${item.ingredient.name} | Price: ${item.ingredient.pricePerUnit} | Qty: ${item.quantityGross}`);
            }
        });
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
