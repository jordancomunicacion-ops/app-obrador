
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ingredientName = 'Patata limpia';
    const ingredient = await prisma.ingredient.findFirst({
        where: { name: ingredientName }
    });

    if (!ingredient) {
        console.log('Ingredient not found');
        return;
    }

    // Find recipes using this ingredient
    const recipeItems = await prisma.recipeItem.findMany({
        where: { ingredientId: ingredient.id },
        include: { recipe: true },
        take: 5
    });

    if (recipeItems.length === 0) {
        console.log('No recipes use this ingredient');
        return;
    }

    const recipeIds = recipeItems.map(ri => ri.recipeId);
    console.log('Recipes utilizing Patata limpia:', recipeIds);

    // Find events using these recipes (via MenuItem)
    const menuItems = await prisma.menuItem.findMany({
        where: { recipeId: { in: recipeIds } },
        include: { event: true },
        take: 1
    });

    if (menuItems.length === 0) {
        console.log('No events found using these recipes');
    } else {
        menuItems.forEach(mi => {
            console.log(`Event Found: ID=${mi.event.id}, Name=${mi.event.name}`);
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
