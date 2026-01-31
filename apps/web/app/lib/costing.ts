import { Ingredient, Recipe, RecipeItem, SupplierProduct } from '@prisma/client';
import { convertTo, UnitType } from '@/app/lib/units';

type RecipeWithItems = Recipe & {
    items: (RecipeItem & {
        ingredient?: Ingredient | null;
        subRecipe?: RecipeWithItems | null; // Recursive for future
        sourceProduct?: SupplierProduct | null;
    })[];
};

export function calculateRecipeCost(recipe: RecipeWithItems): number {
    let totalCost = 0;

    for (const item of recipe.items) {
        if (item.type === 'INGREDIENT' && item.ingredient) {
            // Calculate cost of ingredient
            let itemCost = 0;
            const itemUnit = item.unit as UnitType;

            // 1. Try Specific Source Product Cost
            if (item.sourceProduct) {
                const sp = item.sourceProduct;
                const countUnits = ['UD', 'BOTELLA', 'PACK', 'CAJA'];

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
                        // If using ML/L, it's VOL. If using G/KG, it's MASS. If using UD, it's UD.
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

            // 2. Fallback to Generic Ingredient Cost
            if (itemCost === 0) {
                const pricePerUnit = item.ingredient.pricePerUnit;
                const pricingUnit = item.ingredient.pricingUnit as UnitType;

                // Flexible conversion: if units are both count-based, treat as 1:1
                const countUnits = ['UD', 'BOTELLA', 'PACK', 'CAJA'];
                if (countUnits.includes(itemUnit) && countUnits.includes(pricingUnit as string)) {
                    itemCost = item.quantityGross * pricePerUnit;
                } else {
                    const quantityInPricingUnit = convertTo(item.quantityGross, itemUnit, pricingUnit);

                    if (quantityInPricingUnit !== null) {
                        itemCost = quantityInPricingUnit * pricePerUnit;
                    } else {
                        console.warn(`Cannot convert ${itemUnit} to ${pricingUnit} for ingredient ${item.ingredient.name}`);
                    }
                }
            }

            totalCost += itemCost;

        } else if (item.type === 'SUB_RECIPE' && item.subRecipe) {
            // Recursive cost calculation
            const subRecipeCost = calculateRecipeCost(item.subRecipe);

            const countUnits = ['UD', 'BOTELLA', 'PACK', 'CAJA'];
            let subRecipeYield: number = item.subRecipe.yieldQuantity || 0;
            const itemUnit = item.unit as UnitType;
            const yieldUnit = item.subRecipe.yieldUnit as UnitType;

            // 1. If usage is discrete (UD, etc.), prioritize portions
            if (countUnits.includes(itemUnit)) {
                subRecipeYield = item.subRecipe.portions || 1;
            }
            // 2. If usage is mass/vol, use yield quantity with conversion if needed
            else if (subRecipeYield > 0) {
                if (yieldUnit && yieldUnit !== itemUnit) {
                    const convertedYield = convertTo(subRecipeYield, yieldUnit, itemUnit);
                    if (convertedYield !== null) {
                        subRecipeYield = convertedYield;
                    }
                }
            }
            // 3. Fallback to portions if no yield quantity or yield is mass/vol but usage is discrete
            else {
                subRecipeYield = item.subRecipe.portions || 1;
            }

            if (subRecipeYield > 0) {
                totalCost += (subRecipeCost / subRecipeYield) * item.quantityGross;
            }
        }
    }

    return totalCost;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}
