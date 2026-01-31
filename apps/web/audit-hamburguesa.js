
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Auditing Hamburguesa recipe...");

    const recipe = await prisma.recipe.findFirst({
        where: { name: { contains: 'Hamburguesa', mode: 'insensitive' } },
        include: {
            items: {
                include: {
                    ingredient: true,
                    subRecipe: {
                        include: {
                            items: {
                                include: {
                                    ingredient: true,
                                    sourceProduct: true
                                }
                            }
                        }
                    },
                    sourceProduct: true
                }
            }
        }
    });

    if (!recipe) {
        console.log("Recipe not found.");
        return;
    }

    console.log(`\nRecipe: ${recipe.name} (${recipe.id})`);
    console.log(`Portions: ${recipe.portions}`);

    for (const item of recipe.items) {
        if (item.type === 'INGREDIENT') {
            console.log(`- INGREDIENT: ${item.ingredient?.name} | Qty: ${item.quantityGross} ${item.unit}`);
            console.log(`  Source: ${item.sourceProduct?.name} | Price: ${item.sourceProduct?.price} / ${item.sourceProduct?.unit}`);
        } else if (item.type === 'SUB_RECIPE') {
            console.log(`- SUB-RECIPE: ${item.subRecipe?.name} | Qty: ${item.quantityGross} ${item.unit}`);
        }
    }
}

main().finally(() => prisma.$disconnect());
