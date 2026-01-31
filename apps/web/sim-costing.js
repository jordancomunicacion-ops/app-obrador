
// Self-contained simulation script
function calculateRecipeCostSim(recipe) {
    let totalCost = 0;
    const countUnits = ['UD', 'BOTELLA', 'PACK', 'CAJA'];

    for (const item of recipe.items) {
        let itemCost = 0;
        if (item.type === 'INGREDIENT') {
            if (item.sourceProduct) {
                const sp = item.sourceProduct;
                if (sp.unit === item.unit) {
                    itemCost = item.quantityGross * sp.price;
                } else if (countUnits.includes(sp.unit) && sp.quantityPerUnit > 0) {
                    let sourceQtyInBase = sp.quantityPerUnit;
                    if (sp.unit === 'BOTELLA') sourceQtyInBase /= 1000;

                    let usageInBase = item.quantityGross;
                    if (item.unit === 'ML' || item.unit === 'G') usageInBase /= 1000;

                    let ratio = usageInBase / sourceQtyInBase;
                    itemCost = ratio * sp.price;
                }
            }
            if (itemCost === 0 && item.ingredient) {
                itemCost = item.quantityGross * (item.ingredient.pricePerUnit || 0);
            }
            console.log(`  Item ${item.ingredient?.name || '??'}: ${itemCost.toFixed(2)}€`);
            totalCost += itemCost;
        } else if (item.type === 'SUB_RECIPE' && item.subRecipe) {
            const subCost = calculateRecipeCostSim(item.subRecipe);
            const yieldVal = item.subRecipe.yieldQuantity;
            if (yieldVal > 0) {
                const added = (subCost / yieldVal) * item.quantityGross;
                console.log(`  SubRecipe ${item.subRecipe.name}: ${added.toFixed(2)}€ (SubTotal:${subCost.toFixed(2)} / Yield:${yieldVal} * Used:${item.quantityGross})`);
                totalCost += added;
            } else {
                console.log(`  SubRecipe ${item.subRecipe.name}: 0.00€ (MISSING YIELD!)`);
            }
        }
    }
    return totalCost;
}

const mockPatty = {
    name: 'Patty',
    portions: 1,
    yieldQuantity: 0, // SUSPECT!
    items: [{ type: 'INGREDIENT', ingredient: { name: 'Punta', pricePerUnit: 18 }, quantityGross: 0.17, unit: 'KG' }]
};

const mockSalsa = {
    name: 'Salsa vino',
    portions: 12,
    yieldQuantity: 250,
    items: [{ type: 'INGREDIENT', ingredient: { name: 'Vino', pricePerUnit: 1.5 }, quantityGross: 1, unit: 'UD' }]
};

const mockHamburguesa = {
    name: 'Hamburguesa',
    portions: 1,
    items: [
        { type: 'INGREDIENT', ingredient: { name: 'Pan brioche' }, sourceProduct: { price: 1.3, unit: 'PACK', quantityPerUnit: 2 }, quantityGross: 1, unit: 'UD' },
        { type: 'SUB_RECIPE', subRecipe: mockPatty, quantityGross: 1, unit: 'UD' },
        { type: 'SUB_RECIPE', subRecipe: mockSalsa, quantityGross: 50, unit: 'ML' },
        { type: 'INGREDIENT', ingredient: { name: 'Patatas' }, sourceProduct: { price: 0.98, unit: 'KG' }, quantityGross: 0.7, unit: 'KG' }
    ]
};

console.log("Simulating Hamburguesa Cost:");
const total = calculateRecipeCostSim(mockHamburguesa);
console.log(`\nTOTAL COST: ${total.toFixed(2)}€`);
