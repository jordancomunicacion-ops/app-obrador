
const { calculateRecipeCost, formatCurrency } = require('./app/lib/costing.ts');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Final Verification: Hamburguesa Cost...");

    const recipe = await prisma.recipe.findFirst({
        where: { name: 'Hamburguesa' },
        include: {
            items: {
                include: {
                    ingredient: true,
                    sourceProduct: { include: { supplierEntity: true } },
                    subRecipe: {
                        include: {
                            items: {
                                include: {
                                    ingredient: true,
                                    sourceProduct: true,
                                    subRecipe: {
                                        include: {
                                            items: {
                                                include: {
                                                    ingredient: true,
                                                    sourceProduct: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!recipe) {
        console.log("Recipe not found.");
        return;
    }

    const totalCost = calculateRecipeCost(recipe);
    console.log(`\nRecipe: ${recipe.name}`);
    console.log(`Calculated Total Cost: ${formatCurrency(totalCost)}`);
    console.log(`Cost per Portion: ${formatCurrency(totalCost / recipe.portions)}`);
}

main().finally(() => prisma.$disconnect());
