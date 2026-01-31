
const { calculateRecipeCost } = require('./app/lib/costing.ts');

const mockRecipe = {
    id: 'test',
    name: 'Test Recipe',
    items: [
        {
            type: 'INGREDIENT',
            quantityGross: 1,
            unit: 'UD',
            ingredient: {
                id: 'ing1',
                name: 'Ingrediente por raciones',
                pricePerUnit: 10,
                pricingUnit: 'UD'
            },
            sourceProduct: {
                id: 'sp1',
                name: 'Caja de 6',
                price: 60, // 60€ for the whole box
                unit: 'CAJA',
                quantityPerUnit: 6 // 6 units in the box
            }
        }
    ]
};

// We need to bypass the TypeScript types for the test if running with node
console.log("Testing Caja de 6 with 1 UD usage...");
const cost = calculateRecipeCost(mockRecipe);
console.log(`Resulting Cost: ${cost}€ (Expected: 10€)`);

if (cost === 10) {
    console.log("✅ SUCCESS: Ratio calculation is correct.");
} else {
    console.log("❌ FAILURE: Ratio calculation is incorrect.");
}
