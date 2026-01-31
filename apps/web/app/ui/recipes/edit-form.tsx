'use client';

import { updateRecipe } from '@/app/lib/actions/recipes';
import type { RecipeFormState } from '@/app/lib/definitions';
import Link from 'next/link';
import {
    PlusIcon,
    TrashIcon,
    Bars3Icon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { useActionState, useState } from 'react';
import { Ingredient, Recipe, RecipeItem, RecipeStep, TransformationOutput, SupplierProduct, RecipeCategory, RecipePackaging } from '@prisma/client';
import { convertTo, UnitType } from '@/app/lib/units';
import SearchableSelect from '@/app/ui/components/searchable-select';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type IngredientWithSources = Ingredient & {
    transformationOutputs: (TransformationOutput & {
        transformation: {
            sourceProduct: SupplierProduct & {
                masterProduct: { name: string } | null
            }
        }
    })[];
    supplierProducts: (SupplierProduct & {
        supplierEntity: {
            name: string;
        } | null;
    })[];
};

type RecipeItemInput = {
    key: string;
    id?: string;
    type: 'INGREDIENT' | 'SUB_RECIPE';
    ingredientId: string;
    subRecipeId: string;
    sourceProductId?: string; // Selected provider
    quantityGross: number;
    unit: string;
};

// Define ExtendedRecipe locally to ensure type safety even if Prisma client is stale
type ExtendedRecipe = Recipe & {
    items: RecipeItem[];
    steps: RecipeStep[];
    isGlutenFree?: boolean;
    isVegan?: boolean;
    isVegetarian?: boolean;
    isLactoseFree?: boolean;
    allergens?: string | null;
};

export default function EditForm({
    recipe,
    ingredients,
    categories,
    packaging,
    availableSubRecipes = []
}: {
    recipe: ExtendedRecipe,
    ingredients: IngredientWithSources[],
    categories: RecipeCategory[],
    packaging: RecipePackaging[],
    availableSubRecipes?: Recipe[]
}) {
    const initialState: RecipeFormState = { message: null, errors: {} };
    const updateRecipeWithId = updateRecipe.bind(null, recipe.id);
    const [state, formAction] = useActionState(updateRecipeWithId, initialState);
    const dndContextId = `dnd-steps-${recipe.id}`;

    // Yield state for cost calc
    const [yieldVal, setYieldVal] = useState(recipe.yieldQuantity || 1);

    // Transform DB items to state items
    const [items, setItems] = useState<RecipeItemInput[]>(
        recipe.items.map((item: RecipeItem) => ({
            key: item.id, // use DB id as key for existing
            id: item.id,
            type: item.type as 'INGREDIENT' | 'SUB_RECIPE', // Cast from string
            ingredientId: item.ingredientId || '',
            subRecipeId: item.subRecipeId || '',
            sourceProductId: item.sourceProductId || '',
            quantityGross: item.quantityGross,
            unit: item.unit
        }))
    );

    const [selectedPackaging, setSelectedPackaging] = useState(recipe.packaging || '');

    const isPack = selectedPackaging.toLowerCase().includes('caja') ||
        selectedPackaging.toLowerCase().includes('pack') ||
        selectedPackaging.toLowerCase().includes('estuche') ||
        selectedPackaging.toLowerCase().includes('lata');

    const addItem = () => {
        setItems([
            ...items,
            {
                key: crypto.randomUUID(),
                type: 'INGREDIENT',
                ingredientId: '',
                subRecipeId: '',
                sourceProductId: '',
                quantityGross: 0,
                unit: 'KG',
            },
        ]);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: keyof RecipeItemInput, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Reset source if ingredient changes
        if (field === 'ingredientId') {
            newItems[index].sourceProductId = '';
        }

        setItems(newItems);
    };

    // Steps State
    // Steps State
    type StepInput = {
        key: string;
        order: number;
        description: string;
        action?: string;   // Deprecated
        subAction?: string; // Deprecated
        ingredients?: {
            id: string,
            type: 'INGREDIENT' | 'SUB_RECIPE',
            action?: string,
            subAction?: string
        }[];
    };
    const [steps, setSteps] = useState<StepInput[]>(
        (recipe.steps || []).sort((a: any, b: any) => a.order - b.order).map((step: any) => ({
            key: step.id,
            order: step.order,
            description: step.description,
            action: step.action || '',
            subAction: step.subAction || '',
            ingredients: (step.stepIngredients && step.stepIngredients.length > 0)
                ? step.stepIngredients.map((si: any) => ({
                    id: si.ingredientId || si.subRecipeId,
                    type: si.ingredientId ? 'INGREDIENT' : 'SUB_RECIPE',
                    action: si.action || '',
                    subAction: si.subAction || ''
                }))
                : (step.ingredientId
                    ? [{ id: step.ingredientId, type: 'INGREDIENT', action: step.action, subAction: step.subAction }]
                    : (step.subRecipeId ? [{ id: step.subRecipeId, type: 'SUB_RECIPE', action: step.action, subAction: step.subAction }] : []))
        }))
    );

    const ACTIONS: Record<string, string[]> = {
        'CORTAR': ['Brunoisse', 'Juliana', 'Mirepoix', 'Rodajas', 'Gajos'],
        'DESPIEZAR': ['Filetear', 'Picar', 'Limpiar', 'Deshuesar'],
        'COCCION': ['Directa', 'Indirecta', 'Al vacío', 'Hervir', 'Sofreír', 'Asar'],
        'MEZCLAR': ['Batir', 'Remover', 'Amasar'],
        'OTROS': ['Marinar', 'Reposar', 'Emplatar', 'Reducir', 'Colar']
    };

    const addStep = () => {
        setSteps([...steps, { key: crypto.randomUUID(), order: steps.length + 1, description: '', action: '', subAction: '', ingredients: [] }]);
    };

    const removeStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        // Reorder
        const reordered = newSteps.map((s, i) => ({ ...s, order: i + 1 }));
        setSteps(reordered);
    };

    const updateStep = (index: number, field: keyof StepInput, value: any) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };

        // Reset subAction if action changes
        if (field === 'action') {
            newSteps[index].subAction = '';
        }

        setSteps(newSteps);
    };

    // Calculate cost on the fly
    const totalCost = items.reduce((sum, item) => {
        if (item.type === 'INGREDIENT' && item.ingredientId) {
            const ingredient = ingredients.find(i => i.id === item.ingredientId);
            if (ingredient) {
                // 1. Try Specific Source Product Cost
                if (item.sourceProductId) {
                    const sp = ingredient.supplierProducts.find(p => p.id === item.sourceProductId);
                    if (sp) {
                        // usageQuantity: item.quantityGross (e.g. 0.5)
                        // usageUnit: item.unit (e.g. L)
                        // sp.price: (e.g. 5 EUR)
                        // sp.unit: (e.g. UD - Bottle)
                        // sp.quantityPerUnit: (e.g. 0.75 - implies L/Kg based on context, usually matching ingredient dimension)

                        // Case A: Units match
                        if (sp.unit === item.unit) {
                            return sum + (item.quantityGross * sp.price);
                        }

                        // Case B: SP is UD, Item is Mass/Vol, SP has conversion info (quantityPerUnit)
                        if (sp.unit === 'UD' && sp.quantityPerUnit && sp.quantityPerUnit > 0) {
                            // Assume sp.quantityPerUnit represents the amount in base units (L/Kg) of the ingredient
                            // Cost = (Usage / QtyPerUnit) * PricePerUnit
                            // e.g. (0.5 L / 0.75 L) * 5 EUR

                            // Check item unit vs ingredient pricing unit (assuming QtyPerUnit matches pricing unit dim)
                            const convertedUsage = convertTo(item.quantityGross, item.unit as UnitType, 'L'); // Try L
                            const convertedUsageKg = convertTo(item.quantityGross, item.unit as UnitType, 'KG'); // Try KG

                            // Heuristic: If ingredient defaults to L/ML, use L conversion. If KG/G use KG.
                            // If pricingUnit is UD, we are blind, but usually liquids (Vino) are L.

                            let ratio = 0;
                            // Try to normalize usage to the number inside the unit.
                            // Simplified: We assume quantityPerUnit is in the SAME dimension as item.unit if compatible

                            // Try direct conversion mechanism
                            // If item is 0.5 L and QtyPerUnit is 0.75 (L implied)
                            if (['L', 'ML'].includes(item.unit) || ['KG', 'G'].includes(item.unit)) {
                                // Convert item quantity to a standard "1" unit (L or KG) to match QtyPerUnit magnitude?
                                // Let's assume QtyPerUnit is in L or KG.
                                let usageInStd = item.quantityGross;
                                if (item.unit === 'ML' || item.unit === 'G') usageInStd /= 1000;

                                ratio = usageInStd / sp.quantityPerUnit;
                                return sum + (ratio * sp.price);
                            }
                        }
                    }
                }

                // 2. Fallback to Ingredient Pricing Unit
                const quantityInPricingUnit = convertTo(item.quantityGross, item.unit as UnitType, ingredient.pricingUnit as UnitType);
                if (quantityInPricingUnit !== null) {
                    return sum + (quantityInPricingUnit * ingredient.pricePerUnit);
                }
            }
        }
        return sum;
    }, 0);

    // Cost per portion (if portions exist) otherwise cost of the whole recipe
    const costPerUnit = recipe.portions && recipe.portions > 0
        ? totalCost / recipe.portions
        : totalCost;

    // Helper to get ingredient name from ID
    const getIngredientOptions = () => {
        const rawOptions = items.map(item => {
            if (item.type === 'INGREDIENT') {
                const ing = ingredients.find(i => i.id === item.ingredientId);
                return ing ? { id: ing.id, name: ing.name, type: 'INGREDIENT' } : null;
            } else if (item.type === 'SUB_RECIPE') {
                const sub = availableSubRecipes.find(r => r.id === item.subRecipeId);
                return sub ? { id: sub.id, name: sub.name, type: 'SUB_RECIPE' } : null;
            }
            return null;
        }).filter(Boolean) as { id: string, name: string, type: 'INGREDIENT' | 'SUB_RECIPE' }[];

        // Deduplicate
        const unique = new Map();
        rawOptions.forEach(op => unique.set(op.id, op));
        return Array.from(unique.values());
    };

    const availableIngredients = getIngredientOptions();

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSteps((items) => {
                const oldIndex = items.findIndex((item) => item.key === active.id);
                const newIndex = items.findIndex((item) => item.key === over.id);

                const newOrder = arrayMove(items, oldIndex, newIndex);
                // Re-assign order numbers based on new position
                return newOrder.map((step, index) => ({ ...step, order: index + 1 }));
            });
        }
    }

    return (
        <form action={formAction}>
            <div className="rounded-md bg-gray-50 p-4 md:p-6">




                {/* Cost Summary Card */}
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-blue-50 p-4 border border-blue-100">
                    <div>
                        <p className="text-sm text-blue-600 font-semibold">Coste Total Receta</p>
                        <p className="text-2xl font-bold text-blue-800">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalCost)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-green-600 font-semibold">
                            {recipe.portions && recipe.portions > 0 ? 'Coste por Ración' : 'Coste Total'}
                        </p>
                        <p className="text-2xl font-bold text-green-800">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(costPerUnit)}</p>
                    </div>
                </div>

                {/* Normalize numbers: Replace commas with dots for decimal numbers */}
                <input type="hidden" name="items" value={JSON.stringify(items.map(item => ({
                    ...item,
                    quantityGross: parseFloat(String(item.quantityGross).replace(',', '.')) || 0
                })))} />
                <input type="hidden" name="steps" value={JSON.stringify(steps)} />

                {/* Recipe Name */}
                <div className="mb-4">
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                        Nombre de la Receta <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <input
                            id="name"
                            name="name"
                            type="text"
                            defaultValue={recipe.name}
                            placeholder=""
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            aria-describedby="name-error"
                        />
                        <div id="name-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.name &&
                                state.errors.name.map((error: string) => (
                                    <p key={error} className="mt-2 text-sm text-red-500">
                                        {error}
                                    </p>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Technical Info Grid */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-6 border-gray-200">
                    {/* Classification (Old Category) */}
                    <div>
                        <label htmlFor="classification" className="mb-2 block text-sm font-medium">Clasificación</label>
                        <select
                            id="classification"
                            name="classification"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            defaultValue={(recipe as any).classification || ''}
                        >
                            <option value="" disabled>Seleccionar Clasificación...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <div id="classification-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.classification && state.errors.classification.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                            ))}
                        </div>
                    </div>

                    {/* New fixed Category (Type) */}
                    <div>
                        <label htmlFor="category" className="mb-2 block text-sm font-medium">Tipo de Receta <span className="text-red-500">*</span></label>
                        <select
                            id="category"
                            name="category"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            defaultValue={recipe.category || 'ELABORACION_FINAL'}
                        >
                            <option value="PRODUCTO_NO_ELABORADO">Producto No Elaborado</option>
                            <option value="ELABORACION_INTERMEDIA">Elaboración Intermedia</option>
                            <option value="ELABORACION_FINAL">Elaboración Final</option>
                        </select>
                        <div id="category-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.category && state.errors.category.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="packaging" className="mb-2 block text-sm font-medium">Envasado / Molde</label>
                        <select
                            id="packaging"
                            name="packaging"
                            defaultValue={recipe.packaging || ''}
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            onChange={(e) => setSelectedPackaging(e.target.value)}
                        >
                            <option value="">Seleccionar Envase...</option>
                            <optgroup label="Envases">
                                {packaging.filter(p => (p as any).type === 'ENVASE' || !(p as any).type).map((pkg) => (
                                    <option key={pkg.id} value={pkg.name}>{pkg.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Moldes / Platos">
                                {packaging.filter(p => (p as any).type === 'MOLDE').map((pkg) => (
                                    <option key={pkg.id} value={pkg.name}>{pkg.name}</option>
                                ))}
                            </optgroup>
                        </select>
                        <div id="packaging-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.packaging && state.errors.packaging.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Yield & Portions Section */}
                <div className="mb-6 border-b pb-6 border-gray-200">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Rendimiento y Raciones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Portions */}
                        <div>
                            <label htmlFor="portions" className="mb-2 block text-sm font-medium">
                                {isPack ? 'Unidades por Caja/Pack' : 'Nº Raciones'}
                            </label>
                            <input
                                id="portions"
                                name="portions"
                                type="number"
                                defaultValue={recipe.portions || ''}
                                placeholder=""
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm placeholder:text-gray-500"
                                onChange={(e) => {
                                    // Update state for calculation if needed, though mostly visual
                                }}
                            />
                            <div id="portions-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.portions && state.errors.portions.map((error: string) => (
                                    <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                                ))}
                            </div>
                        </div>

                        {/* Yield Quantity */}
                        <div>
                            <label htmlFor="yieldQuantity" className="mb-2 block text-sm font-medium">
                                Cantidad Resultante (Total)
                            </label>
                            <input
                                id="yieldQuantity"
                                name="yieldQuantity"
                                type="number"
                                step="any"
                                value={yieldVal}
                                onChange={(e) => setYieldVal(parseFloat(e.target.value) || 0)}
                                placeholder=""
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm placeholder:text-gray-500"
                            />
                        </div>

                        {/* Yield Unit */}
                        <div>
                            <label htmlFor="yieldUnit" className="mb-2 block text-sm font-medium">Unidad Resultante</label>
                            <select
                                id="yieldUnit"
                                name="yieldUnit"
                                defaultValue={recipe.yieldUnit || 'L'}
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            >
                                <option value="KG">KG</option>
                                <option value="G">G</option>
                                <option value="L">L</option>
                                <option value="ML">ML</option>
                                <option value="UD">UD</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Preparation Times */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6 border-gray-200">
                    <div>
                        <label htmlFor="prepTime" className="mb-2 block text-sm font-medium">Tiempo Preparación (mins)</label>
                        <input id="prepTime" name="prepTime" type="number" defaultValue={recipe.prepTime || ''} placeholder="" className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm placeholder:text-gray-500" />
                    </div>
                    <div>
                        <label htmlFor="cookTime" className="mb-2 block text-sm font-medium">Tiempo Cocción (mins)</label>
                        <input id="cookTime" name="cookTime" type="number" defaultValue={recipe.cookTime || ''} placeholder="" className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm placeholder:text-gray-500" />
                    </div>
                </div>

                {/* Instructions */}
                <div className="mb-4">
                    <label htmlFor="instructions" className="mb-2 block text-sm font-medium">
                        Notas
                    </label>
                    <textarea
                        id="instructions"
                        name="instructions"
                        rows={3}
                        defaultValue={recipe.instructions || ''}
                        placeholder=""
                        className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                    ></textarea>
                </div>

                {/* Diet & Allergens Section */}
                <div className="mb-6 border-b pb-6 border-gray-200 bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-blue-500" />
                        Dieta y Alérgenos
                    </h3>

                    {/* Dietary Flags */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { id: 'isGlutenFree', label: 'Sin Gluten', icon: '🌾', initial: (recipe as any).isGlutenFree },
                            { id: 'isVegan', label: 'Vegano', icon: '🌱', initial: (recipe as any).isVegan },
                            { id: 'isVegetarian', label: 'Vegetariano', icon: '🥗', initial: (recipe as any).isVegetarian },
                            { id: 'isLactoseFree', label: 'Sin Lactosa', icon: '🥛', initial: (recipe as any).isLactoseFree },
                        ].map((diet) => (
                            <label key={diet.id} className="flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    defaultChecked={diet.initial}
                                    onChange={(e) => {
                                        const hiddenInput = document.getElementById(`hidden_${diet.id}`) as HTMLInputElement;
                                        if (hiddenInput) hiddenInput.value = String(e.target.checked);
                                    }}
                                />
                                <input type="hidden" id={`hidden_${diet.id}`} name={diet.id} value={String(diet.initial)} />
                                <span className="text-sm font-medium text-gray-700">
                                    <span className="mr-1">{diet.icon}</span> {diet.label}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Allergens Checklist */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Alérgenos Obligatorios (UE)</label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {(() => {
                                const activeAllergens = recipe.allergens ? recipe.allergens.split(',') : [];
                                return [
                                    'Altramuces', 'Apio', 'Cacahuetes', 'Crustáceos', 'Frutos de Cáscara', 'Gluten',
                                    'Granos de Sésamo', 'Huevo', 'Leche', 'Moluscos', 'Mostaza', 'Pescado', 'Soja', 'Sulfitos'
                                ].map((allergen) => (
                                    <label key={allergen} className="flex items-center gap-2 px-2 py-1.5 border border-gray-100 rounded hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                                            defaultChecked={activeAllergens.includes(allergen)}
                                            onChange={(e) => {
                                                const allergensInput = document.getElementById('allergens_input') as HTMLInputElement;
                                                let currentAllergens = allergensInput.value ? allergensInput.value.split(',') : [];
                                                if (e.target.checked) {
                                                    if (!currentAllergens.includes(allergen)) currentAllergens.push(allergen);
                                                } else {
                                                    currentAllergens = currentAllergens.filter(a => a !== allergen);
                                                }
                                                allergensInput.value = currentAllergens.join(',');
                                            }}
                                        />
                                        <span className="text-xs text-gray-600">{allergen}</span>
                                    </label>
                                ));
                            })()}
                        </div>
                        <input type="hidden" id="allergens_input" name="allergens" defaultValue={recipe.allergens || ''} />
                    </div>
                </div>

                {/* Dynamic Items List */}
                <div className="mb-4 mt-8">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Ingredientes</h3>
                        <button type="button" onClick={addItem} className="flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-sm text-blue-600 hover:bg-blue-200">
                            <PlusIcon className="w-4" /> Añadir Item
                        </button>
                    </div>

                    {items.length === 0 && <p className="text-gray-500 italic text-sm">No hay ingredientes añadidos.</p>}

                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <div key={item.key} className="flex flex-col md:flex-row gap-2 items-start md:items-center p-3 bg-white rounded border border-gray-200">
                                {/* Type Selection */}
                                <div className="w-full md:w-32">
                                    <select
                                        className="block w-full rounded-md border-gray-200 text-sm font-medium"
                                        value={item.type}
                                        onChange={(e) => {
                                            const newType = e.target.value as 'INGREDIENT' | 'SUB_RECIPE';
                                            // Reset IDs when type changes to prevent invalid state
                                            const newItems = [...items];
                                            newItems[index] = {
                                                ...newItems[index],
                                                type: newType,
                                                ingredientId: '',
                                                subRecipeId: '',
                                                sourceProductId: ''
                                            };
                                            setItems(newItems);
                                        }}
                                    >
                                        <option value="INGREDIENT">Ingrediente</option>
                                        <option value="SUB_RECIPE">Sub-Receta</option>
                                    </select>
                                </div>

                                {/* Item Selection (Conditional based on Type) */}
                                <div className="flex-grow w-full md:w-auto">
                                    {/* Item Selection */}

                                    {item.type === 'INGREDIENT' ? (
                                        <SearchableSelect
                                            options={(() => {
                                                const rawOptions = [
                                                    ...ingredients.filter(i => (!i.transformationOutputs || i.transformationOutputs.length === 0)).map(ing => {
                                                        // Clean name: remove content in parentheses and trim for display
                                                        const cleanName = ing.name.replace(/\s*\(.*?\)\s*/g, '').trim();
                                                        return {
                                                            value: ing.id,
                                                            label: cleanName,
                                                            group: 'Productos No Elaborados'
                                                        };
                                                    }),
                                                    ...ingredients.filter(i => (i.transformationOutputs && i.transformationOutputs.length > 0)).map(ing => {
                                                        let displayName = ing.name;
                                                        const sources = ing.transformationOutputs?.map(o =>
                                                            o.transformation.sourceProduct.masterProduct?.name ||
                                                            o.transformation.sourceProduct.name
                                                        );
                                                        if (sources && sources.length > 0) {
                                                            // Helper to normalize strings for comparison (remove stop words, lowercase)
                                                            const normalize = (s: string) => s.toLowerCase()
                                                                .replace(/\b(de|del|la|el|los|las|y|o)\b/g, '') // Remove Spanish stop words
                                                                .replace(/[^a-z0-9áéíóúñ]/g, '') // Remove special chars
                                                                .trim();

                                                            // 1. Clean and Dedup Sources
                                                            const uniqueMap = new Map<string, string>();
                                                            sources.forEach(s => {
                                                                // Basic clean first
                                                                const cleanS = s.replace(/\s*\(.*?\)\s*/g, '').trim();
                                                                const key = normalize(cleanS);
                                                                if (!uniqueMap.has(key)) {
                                                                    uniqueMap.set(key, cleanS);
                                                                }
                                                            });

                                                            const uniqueCleanSources = Array.from(uniqueMap.values());
                                                            const prefix = uniqueCleanSources.join(' / ');

                                                            // 2. Smartly remove prefix from ingredient name
                                                            const tokenize = (s: string) => s.split(/\s+/).filter(t => t.length > 0);
                                                            const normalizeToken = (t: string) => t.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, '');
                                                            const isStopWord = (t: string) => /^(de|del|la|el|los|las|y|o)$/i.test(t);

                                                            const ingWords = tokenize(ing.name);
                                                            const refPrefixWords = tokenize(uniqueCleanSources[0] || '');

                                                            let pIdx = 0;
                                                            let iIdx = 0;

                                                            while (pIdx < refPrefixWords.length && iIdx < ingWords.length) {
                                                                const pToken = normalizeToken(refPrefixWords[pIdx]);
                                                                const iTokenRaw = ingWords[iIdx];

                                                                if (isStopWord(iTokenRaw)) {
                                                                    iIdx++;
                                                                    continue;
                                                                }
                                                                if (isStopWord(refPrefixWords[pIdx])) {
                                                                    pIdx++;
                                                                    continue;
                                                                }

                                                                const iToken = normalizeToken(iTokenRaw);

                                                                if (pToken === iToken) {
                                                                    pIdx++;
                                                                    iIdx++;
                                                                } else {
                                                                    break;
                                                                }
                                                            }

                                                            const remainingIngName = ingWords.slice(iIdx).join(' ');

                                                            displayName = remainingIngName
                                                                ? `${prefix} ${remainingIngName}`
                                                                : prefix;
                                                        }
                                                        return {
                                                            value: ing.id,
                                                            label: displayName,
                                                            group: 'Despieces / Elaboraciones'
                                                        };
                                                    })
                                                ];

                                                const unique = new Map();
                                                rawOptions.forEach(op => {
                                                    const key = op.label.replace(/[^a-z0-9]/gi, '').toLowerCase();
                                                    if (!unique.has(key)) {
                                                        unique.set(key, op);
                                                    }
                                                });
                                                return Array.from(unique.values());
                                            })()}
                                            value={item.ingredientId}
                                            onChange={(value) => updateItem(index, 'ingredientId', value)}
                                            placeholder="Buscar ingrediente..."
                                            className="w-full"
                                        />
                                    ) : (
                                        <select
                                            className="block w-full rounded-md border-gray-200 text-sm"
                                            value={item.subRecipeId}
                                            onChange={(e) => {
                                                const selectedId = e.target.value;
                                                const recipe = availableSubRecipes?.find(r => r.id === selectedId);

                                                const newItems = [...items];
                                                newItems[index] = {
                                                    ...newItems[index],
                                                    subRecipeId: selectedId,
                                                    unit: recipe?.yieldUnit || 'UD'
                                                };
                                                setItems(newItems);
                                            }}
                                        >
                                            <option value="">Seleccionar Sub-Receta...</option>
                                            {availableSubRecipes.map(recipe => (
                                                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Source/Provider Selection (if available for this ingredient) */}
                                {(() => {
                                    const selectedIng = ingredients.find(i => i.id === item.ingredientId);

                                    // Combine sources: TransformationOutputs AND SupplierProducts
                                    const transformationSources = selectedIng?.transformationOutputs || [];
                                    const supplierSources = selectedIng?.supplierProducts || [];

                                    if (transformationSources.length > 0 || supplierSources.length > 0) {
                                        return (
                                            <div className="flex-grow w-full md:w-auto">
                                                <select
                                                    className="block w-full rounded-md border-gray-200 text-sm text-gray-600"
                                                    value={item.sourceProductId || ''}
                                                    onChange={(e) => updateItem(index, 'sourceProductId', e.target.value)}
                                                >
                                                    <option value="">-- Origen Genérico --</option>

                                                    {/* OptGroup for Buying Options (Direct Suppliers) */}
                                                    {supplierSources.length > 0 && (
                                                        <optgroup label="Proveedores (Compra Directa)">
                                                            {supplierSources.map(prod => {
                                                                const quantityDisplay = prod.quantityPerUnit
                                                                    ? (
                                                                        (prod.unit === 'L' && prod.quantityPerUnit < 1) ? `${prod.quantityPerUnit * 1000}ml` :
                                                                            (prod.unit === 'KG' && prod.quantityPerUnit < 1) ? `${prod.quantityPerUnit * 1000}g` :
                                                                                `${prod.quantityPerUnit}${prod.unit}`
                                                                    )
                                                                    : prod.unit;

                                                                return (
                                                                    <option key={prod.id} value={prod.id}>
                                                                        {prod.supplier || prod.supplierEntity?.name || 'Proveedor N/D'} ({quantityDisplay})
                                                                    </option>
                                                                );
                                                            })}
                                                        </optgroup>
                                                    )}

                                                    {/* OptGroup for Transformations (Yield Tests) */}
                                                    {(() => {
                                                        const uniqueSources = new Map();
                                                        transformationSources.forEach(output => {
                                                            const spId = output.transformation.sourceProduct.id;
                                                            if (!uniqueSources.has(spId)) {
                                                                uniqueSources.set(spId, output);
                                                            }
                                                        });
                                                        const distinctSources = Array.from(uniqueSources.values());

                                                        return distinctSources.length > 0 && (
                                                            <optgroup label="Transformaciones (Rendimientos)">
                                                                {distinctSources.map(output => (
                                                                    <option key={output.id} value={output.transformation.sourceProduct.id}>
                                                                        {output.transformation.sourceProduct.supplier || output.transformation.sourceProduct.supplierEntity?.name || 'Proveedor N/D'} ({output.percentage.toFixed(0)}%)
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        );
                                                    })()}
                                                </select>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Quantity */}
                                <div className="w-20 md:w-24">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        className="block w-full rounded-md border-gray-200 text-sm py-2"
                                        value={item.quantityGross}
                                        onChange={(e) => updateItem(index, 'quantityGross', Number(e.target.value))}
                                    />
                                </div>

                                {/* Unit */}
                                <div className="w-20 md:w-24">
                                    <select
                                        className="block w-full rounded-md border-gray-200 text-sm py-2"
                                        value={item.unit}
                                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                    >
                                        <option value="KG">KG</option>
                                        <option value="G">G</option>
                                        <option value="L">L</option>
                                        <option value="ML">ML</option>
                                        <option value="UD">UD</option>
                                    </select>
                                </div>

                                {/* Remove Action */}
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1">
                                    <TrashIcon className="w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Steps List */}
                <div className="mb-6 mt-8">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Método de elaboración (Pasos)</h3>
                        <button type="button" onClick={addStep} className="flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-sm text-blue-600 hover:bg-blue-200">
                            <PlusIcon className="w-4" /> Añadir Paso
                        </button>
                    </div>
                    {steps.length === 0 && <p className="text-gray-500 italic text-sm">No hay pasos definidos.</p>}

                    <DndContext
                        id={dndContextId}
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={steps.map(s => s.key)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {steps.map((step, index) => (
                                    <SortableStep
                                        key={step.key}
                                        step={step}
                                        index={index}
                                        updateStep={(field: string, val: any) => updateStep(index, field as keyof StepInput, val)}
                                        removeStep={() => removeStep(index)}
                                        ACTIONS={ACTIONS}
                                        availableIngredients={availableIngredients}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                <div aria-live="polite" aria-atomic="true">
                    {state.message && (
                        <p className="mt-2 text-sm text-red-500">{state.message}</p>
                    )}
                </div>
            </div >
            <div className="mt-6 flex justify-end gap-4">
                <Link
                    href="/dashboard/recipes"
                    className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Actualizar Receta
                </button>
            </div>
        </form >
    );
}

// Sub-component for Sortable Step
function SortableStep({ step, index, updateStep, removeStep, ACTIONS, availableIngredients }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: step.key });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex flex-col gap-2 p-3 bg-white rounded border border-gray-200 shadow-sm relative group">
            {/* Drag Handle & Header */}
            <div className="flex gap-2 items-start">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-move p-1 text-gray-400 hover:text-gray-600 mt-0.5"
                >
                    <Bars3Icon className="w-5 h-5" />
                </div>

                <span className="flex-none flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 font-bold text-xs text-gray-600 mt-1">
                    {step.order}
                </span>

                <textarea
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    rows={2}
                    placeholder=""
                    value={step.description}
                    onChange={(e) => updateStep('description', e.target.value)}
                ></textarea>

                <button type="button" onClick={removeStep} className="text-red-500 hover:text-red-700 p-1">
                    <TrashIcon className="w-5" />
                </button>
            </div>

            {/* Ingredients List with Actions */}
            <div className="ml-10 flex flex-col gap-2 w-full">
                {step.ingredients?.length > 0 && (
                    <div className="space-y-2">
                        {step.ingredients.map((ingRef: any, iIndex: number) => {
                            const ingName = availableIngredients.find((ai: any) => ai.id === ingRef.id)?.name || 'Desconocido';
                            return (
                                <div key={`${ingRef.id}-${iIndex}`} className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded border border-gray-100">
                                    <span className="text-sm font-medium text-gray-700 min-w-[150px]">
                                        {ingName}
                                    </span>

                                    {/* Action Selector */}
                                    <select
                                        className="text-xs rounded border-gray-200 py-1 pl-2 pr-6"
                                        value={ingRef.action || ''}
                                        onChange={(e) => {
                                            const newAction = e.target.value;
                                            const newIngredients = [...(step.ingredients || [])];
                                            newIngredients[iIndex] = {
                                                ...newIngredients[iIndex],
                                                action: newAction,
                                                subAction: '' // Reset subAction on action change
                                            };
                                            updateStep('ingredients', newIngredients);
                                        }}
                                    >
                                        <option value="">-- Acción --</option>
                                        {Object.keys(ACTIONS).map(act => <option key={act} value={act}>{act}</option>)}
                                    </select>

                                    {/* SubAction Selector */}
                                    {ingRef.action && ACTIONS[ingRef.action] && (
                                        <select
                                            className="text-xs rounded border-gray-200 py-1 pl-2 pr-6"
                                            value={ingRef.subAction || ''}
                                            onChange={(e) => {
                                                const newIngredients = [...(step.ingredients || [])];
                                                newIngredients[iIndex] = { ...newIngredients[iIndex], subAction: e.target.value };
                                                updateStep('ingredients', newIngredients);
                                            }}
                                        >
                                            <option value="">-- Técnica --</option>
                                            {ACTIONS[ingRef.action].map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                                        </select>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newIngredients = [...step.ingredients];
                                            newIngredients.splice(iIndex, 1);
                                            updateStep('ingredients', newIngredients);
                                        }}
                                        className="text-red-400 hover:text-red-600 ml-auto"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add Ingredient Logic */}
                <div className="max-w-[250px]">
                    <select
                        className="text-xs rounded border-gray-200 py-1 pl-2 pr-6 w-full"
                        value=""
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            if (!selectedId) return;

                            const selectedOption = availableIngredients.find((ai: any) => ai.id === selectedId);
                            if (selectedOption) {
                                const currentIngredients = step.ingredients || [];
                                // Check if this ingredient is already here with empty action? 
                                // Actually, allow duplicates in edit too if needed, but sticking to no-duplicates logic for now unless requested.
                                // Actually, I should probably allow duplicates now that actions make them distinct.
                                // But keeping logic consistent with create form: unique by ID for now.
                                if (!currentIngredients.some((i: any) => i.id === selectedId)) {
                                    updateStep('ingredients', [...currentIngredients, { id: selectedId, type: selectedOption.type, action: '', subAction: '' }]);
                                }
                            }
                        }}
                    >
                        <option value="">+ Añadir Ingrediente</option>
                        {availableIngredients.map((ing: any) => (
                            <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
