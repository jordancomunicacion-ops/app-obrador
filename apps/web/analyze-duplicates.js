
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Analyzing data for duplicates and orphans...");

    // 1. Fetch all ingredients with their relations
    const ingredients = await prisma.ingredient.findMany({
        include: {
            supplierProducts: {
                include: { masterProduct: true }
            },
            recipeItems: true,
            recipeStepIngredients: true
        }
    });

    const grouped = new Map();
    for (const ing of ingredients) {
        const name = ing.name.trim().toLowerCase();
        if (!grouped.has(name)) grouped.set(name, []);
        grouped.get(name).push(ing);
    }

    console.log("\n--- DUPLICATE INGREDIENTS ---");
    for (const [name, group] of grouped) {
        if (group.length > 1) {
            console.log(`[${name}] - ${group.length} occurrences:`);
            group.forEach(ing => {
                const links = ing.supplierProducts.length;
                const recipes = (ing.recipeItems?.length || 0) + (ing.recipeStepIngredients?.length || 0);
                const linkedToMaster = ing.supplierProducts.some(sp => sp.masterProduct);
                console.log(`  - ID: ${ing.id} | Price: ${ing.pricePerUnit} | SupplierProducts: ${links} | Recipes: ${recipes} | Linked to MasterProduct: ${linkedToMaster}`);
            });
        }
    }

    // 2. Find Orphaned Ingredients (No SupplierProduct links and NOT used in recipes)
    console.log("\n--- ORPHANED INGREDIENTS (Candidates for Deletion) ---");
    const orphans = ingredients.filter(ing =>
        ing.supplierProducts.length === 0 &&
        (ing.recipeItems?.length || 0) === 0 &&
        (ing.recipeStepIngredients?.length || 0) === 0
    );

    orphans.forEach(ing => {
        console.log(`  - ${ing.name} (${ing.id}) - TOTALLY UNUSED`);
    });

    console.log(`\nFound ${orphans.length} totally unused orphaned ingredients.`);

    // 3. Find Ingredients with no SupplierProduct but USED in recipes
    console.log("\n--- INGREDIENTS WITH NO SUPPLIER BUT USED IN RECIPES ---");
    const usedOrphans = ingredients.filter(ing =>
        ing.supplierProducts.length === 0 &&
        ((ing.recipeItems?.length || 0) > 0 || (ing.recipeStepIngredients?.length || 0) > 0)
    );
    usedOrphans.forEach(ing => {
        const recipes = (ing.recipeItems?.length || 0) + (ing.recipeStepIngredients?.length || 0);
        console.log(`  - ${ing.name} (${ing.id}) - USED IN ${recipes} RECIPE ENTRIES`);
    });

    // 4. Find SupplierProducts with no MasterProduct
    const sps = await prisma.supplierProduct.findMany({
        where: { masterProductId: null },
        include: { ingredient: true }
    });
    console.log("\n--- SUPPLIER PRODUCTS WITH NO MASTER PRODUCT ---");
    sps.forEach(sp => {
        console.log(`  - ${sp.name} (${sp.id}) -> Ingredient: ${sp.ingredient?.name || 'NONE'}`);
    });
}

main().finally(() => prisma.$disconnect());
