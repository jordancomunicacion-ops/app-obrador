
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Deep Audit: Hamburguesa Dependencies...");

    // 1. Pan Brioche Product details
    const brioche = await prisma.supplierProduct.findFirst({
        where: { name: { contains: 'Pan brioche', mode: 'insensitive' } }
    });
    console.log(`\nPan Brioche: ${brioche?.name}`);
    console.log(`Price: ${brioche?.price}, Unit: ${brioche?.unit}, QtyPerUnit: ${brioche?.quantityPerUnit}`);

    // 2. Patty Recipe
    const patty = await prisma.recipe.findFirst({
        where: { name: 'Patty' },
        include: { items: { include: { ingredient: true, sourceProduct: true } } }
    });
    console.log(`\nRecipe: Patty (Portions: ${patty?.portions})`);
    if (patty) {
        patty.items.forEach(item => {
            console.log(`- ${item.ingredient?.name || 'Sub-Recipe'} | Qty: ${item.quantityGross} ${item.unit} | Source Price: ${item.sourceProduct?.price || 0}`);
        });
    }

    // 3. Salsa vino Recipe
    const salsa = await prisma.recipe.findFirst({
        where: { name: 'Salsa vino' },
        include: { items: { include: { ingredient: true, sourceProduct: true } } }
    });
    console.log(`\nRecipe: Salsa vino (Portions: ${salsa?.portions}, Yield: ${salsa?.yieldQuantity} ${salsa?.yieldUnit})`);
    if (salsa) {
        salsa.items.forEach(item => {
            console.log(`- ${item.ingredient?.name || 'Sub-Recipe'} | Qty: ${item.quantityGross} ${item.unit} | Source Price: ${item.sourceProduct?.price || 0}`);
        });
    }

    // 4. Patatas info (Ingredient check)
    const patata = await prisma.ingredient.findFirst({
        where: { name: 'Patata limpia' }
    });
    console.log(`\nIngredient: Patata limpia | YieldPercent: ${patata?.yieldPercent}% | PricePerUnit: ${patata?.pricePerUnit}`);
}

main().finally(() => prisma.$disconnect());
