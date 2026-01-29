import { PrismaClient, SupplierProduct, Ingredient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Checking for SupplierProducts without corresponding Ingredients...');

    const products: SupplierProduct[] = await prisma.supplierProduct.findMany();
    const ingredients: Ingredient[] = await prisma.ingredient.findMany();

    const ingredientNames = new Set(ingredients.map((i: Ingredient) => i.name.toLowerCase()));

    const missing = products.filter((p: SupplierProduct) => !ingredientNames.has(p.name.toLowerCase()));

    console.log(`Found ${products.length} products and ${ingredients.length} ingredients.`);

    if (missing.length > 0) {
        console.log('The following products are missing from Ingredients:');
        missing.forEach((p: SupplierProduct) => console.log(`- ${p.name} (Unit: ${p.unit}, Price: ${p.price})`));

        console.log('\nGenerating fix commands...');
        // We can optionally uncomment this to auto-fix
        /*
        for (const p of missing) {
            await prisma.ingredient.create({
                data: {
                    name: p.name,
                    pricingUnit: p.unit,
                    pricePerUnit: p.price
                }
            });
            console.log(`Created ingredient for ${p.name}`);
        }
        */
    } else {
        console.log('All products have corresponding ingredients.');
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
