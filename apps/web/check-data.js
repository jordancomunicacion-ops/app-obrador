const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking database content...');

        const userCount = await prisma.user.count();
        const firstUser = await prisma.user.findFirst();
        if (firstUser) console.log('User created at:', firstUser.createdAt);

        const recipeCount = await prisma.recipe.count();
        const ingredientCount = await prisma.ingredient.count();
        const taskCount = await prisma.task.count();
        const eventCount = await prisma.event.count();
        const menuItemsCount = await prisma.eventMenuItem.count();
        const miseEnPlaceCount = await prisma.miseEnPlaceTask.count();
        const categoryCount = await prisma.recipeCategory.count();
        const packagingCount = await prisma.recipePackaging.count();

        console.log('Users:', userCount);
        console.log('Recipes:', recipeCount);
        console.log('Ingredients:', ingredientCount);
        console.log('Tasks:', taskCount);
        console.log('Events:', eventCount);
        console.log('MenuItems:', menuItemsCount);
        console.log('MiseEnPlace:', miseEnPlaceCount);
        console.log('Categories:', categoryCount);
        console.log('Packaging:', packagingCount);

        if (recipeCount > 0) {
            const firstRecipe = await prisma.recipe.findFirst();
            console.log('Example Recipe:', firstRecipe.name);
        }

    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
