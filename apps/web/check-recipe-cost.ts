
import { PrismaClient } from '@prisma/client';
import { calculateRecipeCost } from './app/lib/costing.ts';

const prisma = new PrismaClient();

async function main() {
    const recipes = await prisma.recipe.findMany({
        where: { name: { contains: 'vino', mode: 'insensitive' } },
        include: {
            items: {
                include: {
                    ingredient: true,
                    sourceProduct: true,
                    subRecipe: {
                        include: {
                            items: {
                                include: {
                                    ingredient: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    console.log(`Found ${recipes.length} recipes.`);

    for (const recipe of recipes) {
        console.log(`\nRecipe: ${recipe.name} (${recipe.id})`);
        console.log(`Items: ${recipe.items.length}`);

        recipe.items.forEach((item, i) => {
            console.log(`  Item ${i + 1}: Type=${item.type}`);
            if (item.ingredient) {
                console.log(`    Ingredient: ${item.ingredient.name}`);
                console.log(`    Qty: ${item.quantityGross} ${item.unit}`);
                console.log(`    Price: ${item.ingredient.pricePerUnit} / ${item.ingredient.pricingUnit}`);
            }
            if (item.sourceProduct) {
                console.log(`    Source: ${item.sourceProduct.name} - ${item.sourceProduct.price} EUR`);
            }
        });

        const cost = calculateRecipeCost(recipe);
        console.log(`Calculated Cost: ${cost} EUR`);
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
