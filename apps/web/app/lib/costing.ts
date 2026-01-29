import { Ingredient, Recipe, RecipeItem } from '@prisma/client';
import { convertTo, UnitType } from '@/app/lib/units';

type RecipeWithItems = Recipe & {
    items: (RecipeItem & {
        ingredient?: Ingredient | null;
        subRecipe?: RecipeWithItems | null; // Recursive for future
    })[];
};

export function calculateRecipeCost(recipe: RecipeWithItems): number {
    let totalCost = 0;

    for (const item of recipe.items) {
        if (item.type === 'INGREDIENT' && item.ingredient) {
            // Calculate cost of ingredient
            // Cost = QuantityUsed * (PricePerUnit / Yield) ? 
            // Usually Price is for Gross quantity. Yield is how much we get after cleaning.
            // If recipe calls for X Gross, we pay for X.
            // If recipe calls for X Net, we need X / Yield Gross to buy.
            // My schema has `quantityGross`. So we just pay for that amount.
            // Yield is informative for "How much edible stuff do I have".
            // BUT if we want to "cost a plate", we care about the cost of the gross amount used.

            const pricePerUnit = item.ingredient.pricePerUnit;
            const pricingUnit = item.ingredient.pricingUnit as UnitType;
            const itemUnit = item.unit as UnitType;

            const quantityInPricingUnit = convertTo(item.quantityGross, itemUnit, pricingUnit);

            if (quantityInPricingUnit !== null) {
                const itemCost = quantityInPricingUnit * pricePerUnit;
                totalCost += itemCost;

                // Debug logging
                if (itemCost === 0) {
                    console.warn(`Cost is 0 for ingredient ${item.ingredient.name}:`, {
                        quantityGross: item.quantityGross,
                        itemUnit,
                        quantityInPricingUnit,
                        pricePerUnit,
                        pricingUnit
                    });
                }
            } else {
                console.warn(`Cannot convert ${itemUnit} to ${pricingUnit} for ingredient ${item.ingredient.name}`);
            }

        } else if (item.type === 'SUB_RECIPE' && item.subRecipe) {
            // Recursive cost calculation (placeholder for now as UI doesn't allow creating sub-recipes easily yet)
            // We would need to calculate sub-recipe cost, divide by its yield, multiplication by quantity used.
            const subRecipeCost = calculateRecipeCost(item.subRecipe);
            const subRecipeYield = item.subRecipe.yieldQuantity;
            // Assuming subRecipeYield unit matches item unit or we convertible.
            // This gets complex. For MVP simplified:
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
