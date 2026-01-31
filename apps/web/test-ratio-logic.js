
// Simplified calculateRecipeCost logic for verification
function calculateRecipeCost(recipe) {
    let totalCost = 0;
    const countUnits = ['UD', 'BOTELLA', 'PACK', 'CAJA'];

    for (const item of recipe.items) {
        let itemCost = 0;
        const itemUnit = item.unit;

        if (item.sourceProduct) {
            const sp = item.sourceProduct;

            // Case A: Units match exactly
            if (sp.unit === itemUnit) {
                itemCost = item.quantityGross * sp.price;
            }
            // Case B: SP is a counting unit with quantity info (Caja de 6, Botella 750ml, etc)
            else if (countUnits.includes(sp.unit) && sp.quantityPerUnit && sp.quantityPerUnit > 0) {
                let sourceQtyInBase = sp.quantityPerUnit;
                let sourceDimension = 'UD';

                if (sp.unit === 'BOTELLA') {
                    sourceQtyInBase = sp.quantityPerUnit / 1000;
                    sourceDimension = 'VOL';
                } else if (sp.unit === 'UD' || sp.unit === 'PACK' || sp.unit === 'CAJA') {
                    sourceDimension = (['L', 'ML', 'CL'].includes(itemUnit)) ? 'VOL' :
                        (['KG', 'G'].includes(itemUnit)) ? 'MASS' : 'UD';
                }

                let usageInBase = item.quantityGross;
                if (itemUnit === 'ML' || itemUnit === 'G') usageInBase /= 1000;
                if (itemUnit === 'CL') usageInBase /= 100;

                const itemIsVol = ['L', 'ML', 'CL'].includes(itemUnit);
                const itemIsMass = ['KG', 'G'].includes(itemUnit);
                const itemIsCount = countUnits.includes(itemUnit);

                if ((sourceDimension === 'VOL' && itemIsVol) ||
                    (sourceDimension === 'MASS' && itemIsMass) ||
                    (sourceDimension === 'UD' && itemIsCount)) {
                    let ratio = usageInBase / sourceQtyInBase;
                    itemCost = ratio * sp.price;
                }
            }
            // Case C: Fallback for counting units (1:1)
            else if (countUnits.includes(sp.unit) && countUnits.includes(itemUnit)) {
                itemCost = item.quantityGross * sp.price;
            }
        }
        totalCost += itemCost;
    }
    return totalCost;
}

const mockRecipe = {
    items: [
        {
            quantityGross: 1,
            unit: 'UD',
            sourceProduct: {
                price: 60,
                unit: 'CAJA',
                quantityPerUnit: 6
            }
        }
    ]
};

console.log("Testing Caja de 6 with 1 UD usage...");
const cost = calculateRecipeCost(mockRecipe);
console.log(`Resulting Cost: ${cost}€ (Expected: 10€)`);

if (cost === 10) {
    console.log("✅ SUCCESS: Ratio calculation is correct.");
} else {
    console.log("❌ FAILURE: Ratio calculation is incorrect.");
}
