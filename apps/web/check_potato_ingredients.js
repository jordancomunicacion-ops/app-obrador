
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ingredients = await prisma.ingredient.findMany({
        where: {
            name: { in: ['Patata pelada', 'Piel de patata', 'Patata limpia', 'Patata'] }
        }
    });
    console.log(ingredients);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
