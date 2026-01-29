'use client';

import { createRecipe } from '@/app/lib/actions/recipes';
import type { RecipeFormState } from '@/app/lib/definitions';
import Link from 'next/link';
import {
    UserCircleIcon,
    TagIcon,
    PlusIcon,
    TrashIcon,
    Bars3Icon, // Import hamburger icon for drag handle
} from '@heroicons/react/24/outline';
import { useActionState, useState } from 'react';
import { Ingredient, TransformationOutput, SupplierProduct, RecipeCategory, RecipePackaging, Recipe } from '@prisma/client';
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

// Type definitions
type IngredientWithSources = Ingredient & {
    transformationOutputs: (TransformationOutput & {
        transformation: {
            sourceProduct: SupplierProduct
        }
    })[]
};

type RecipeItemInput = {
    key: string;
    type: 'INGREDIENT' | 'SUB_RECIPE';
    ingredientId: string;
    subRecipeId: string;
    sourceProductId?: string; // Selected provider
    quantityGross: number;
    unit: string;
};

type StepInput = {
    key: string;
    order: number;
    description: string;
    action?: string;
    subAction?: string;
    ingredientId?: string;
};

export default function Form({
    ingredients,
    categories,
    packaging,
    availableSubRecipes = []
}: {
    ingredients: IngredientWithSources[];
    categories: RecipeCategory[];
    packaging: RecipePackaging[];
    availableSubRecipes?: Recipe[];
}) {
    const initialState: RecipeFormState = { message: null, errors: {} };
    const [state, formAction] = useActionState(createRecipe, initialState);

    const [items, setItems] = useState<RecipeItemInput[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('ELABORACION_FINAL');
    const [selectedPackaging, setSelectedPackaging] = useState('');

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

    // Steps Logic
    type StepInput = {
        key: string;
        order: number;
        description: string;
        action?: string;
        subAction?: string;
        ingredientId?: string;
    };
    const [steps, setSteps] = useState<StepInput[]>([]);

    const ACTIONS: Record<string, string[]> = {
        'CORTAR': ['Brunoisse', 'Juliana', 'Mirepoix', 'Rodajas', 'Gajos'],
        'DESPIEZAR': ['Filetear', 'Picar', 'Limpiar', 'Deshuesar'],
        'COCCION': ['Directa', 'Indirecta', 'Al vacío', 'Hervir', 'Sofreír', 'Asar'],
        'MEZCLAR': ['Batir', 'Remover', 'Amasar'],
        'OTROS': ['Marinar', 'Reposar', 'Emplatar']
    };

    const addStep = () => {
        setSteps([...steps, { key: crypto.randomUUID(), order: steps.length + 1, description: '', action: '', subAction: '', ingredientId: '' }]);
    };

    const removeStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
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

    // Helper to get ingredient name from ID (using items array which has the selected ingredients)
    const getIngredientOptions = () => {
        // We need to match items (RecipeItemInput) to the full Ingredient object passed in props
        return items.map(item => {
            if (item.type === 'INGREDIENT') {
                const ing = ingredients.find(i => i.id === item.ingredientId);
                return ing ? { id: ing.id, name: ing.name } : null;
            } else if (item.type === 'SUB_RECIPE') {
                const sub = availableSubRecipes.find(r => r.id === item.subRecipeId);
                return sub ? { id: sub.id, name: sub.name } : null;
            }
            return null;
        }).filter(Boolean) as { id: string, name: string }[];
    };

    const availableIngredients = getIngredientOptions();

    // Normalize numbers: Replace commas with dots for decimal numbers
    const normalizeItem = (item: RecipeItemInput) => {
        const qtyString = String(item.quantityGross).replace(',', '.');
        return {
            ...item,
            quantityGross: parseFloat(qtyString) || 0
        };
    };

    const normalizedItems = items.map(normalizeItem);

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
                {/* Helper to pass items to server action */}
                <input type="hidden" name="items" value={JSON.stringify(normalizedItems)} />
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
                            placeholder="Ej. Salsa Boloñesa"
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
                            defaultValue=""
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
                            defaultValue="ELABORACION_FINAL"
                            onChange={(e) => setSelectedCategory(e.target.value)}
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
                        <label htmlFor="packaging" className="mb-2 block text-sm font-medium">
                            {selectedCategory === 'ELABORACION_FINAL' ? 'Emplatado (Molde/Plato)' : 'Envasado'}
                        </label>
                        <select
                            id="packaging"
                            name="packaging"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            defaultValue=""
                            onChange={(e) => setSelectedPackaging(e.target.value)}
                        >
                            <option value="">Seleccionar...</option>

                            {(selectedCategory === 'ELABORACION_INTERMEDIA' || selectedCategory === 'PRODUCTO_NO_ELABORADO') && (
                                <optgroup label="Envases">
                                    {packaging.filter(p => (p as any).type === 'ENVASE' || !(p as any).type).map((pkg) => (
                                        <option key={pkg.id} value={pkg.name}>{pkg.name}</option>
                                    ))}
                                </optgroup>
                            )}

                            {selectedCategory === 'ELABORACION_FINAL' && (
                                <optgroup label="Moldes / Platos">
                                    {packaging.filter(p => (p as any).type === 'MOLDE').map((pkg) => (
                                        <option key={pkg.id} value={pkg.name}>{pkg.name}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                        <div id="packaging-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.packaging && state.errors.packaging.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="portions" className="mb-2 block text-sm font-medium">
                            {isPack ? 'Unidades por Caja/Pack' : 'Nº Raciones'}
                        </label>
                        <input id="portions" name="portions" type="number" placeholder={isPack ? "Ej. 12" : "Ej. 36"} className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm placeholder:text-gray-500" />
                        <div id="portions-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.portions && state.errors.portions.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="prepTime" className="mb-2 block text-sm font-medium">Tiempo Preparación (mins)</label>
                        <input id="prepTime" name="prepTime" type="number" placeholder="15" className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm placeholder:text-gray-500" />
                        <div id="prepTime-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.prepTime && state.errors.prepTime.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="cookTime" className="mb-2 block text-sm font-medium">Tiempo Cocción (mins)</label>
                        <input id="cookTime" name="cookTime" type="number" placeholder="27" className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm placeholder:text-gray-500" />
                        <div id="cookTime-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.cookTime && state.errors.cookTime.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Yield Section - HIDDEN: Always 1 UD, quantity determined by Events/Tasks */}
                <input type="hidden" name="yieldQuantity" value="1" />
                <input type="hidden" name="yieldUnit" value="UD" />

                {/* Instructions Summary */}
                <div className="mb-4">
                    <label htmlFor="instructions" className="mb-2 block text-sm font-medium">
                        Notas
                    </label>
                    <textarea
                        id="instructions"
                        name="instructions"
                        rows={2}
                        placeholder="Resumen general..."
                        className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                    ></textarea>
                </div>

                {/* Dynamic Items List */}
                <div className="mb-4 mt-8">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Ingredientes</h3>
                        <button type="button" onClick={addItem} className="flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-sm text-blue-600 hover:bg-blue-200">
                            <PlusIcon className="w-4" /> Añadir Ingrediente
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

                                {/* Item Selection */}
                                <div className="flex-grow w-full md:w-auto">
                                    {item.type === 'INGREDIENT' ? (
                                        <SearchableSelect
                                            options={[
                                                ...ingredients.filter(i => (!i.transformationOutputs || i.transformationOutputs.length === 0)).map(ing => ({
                                                    value: ing.id,
                                                    label: ing.name,
                                                    group: 'Productos No Elaborados'
                                                })),
                                                ...ingredients.filter(i => (i.transformationOutputs && i.transformationOutputs.length > 0)).map(ing => {
                                                    let displayName = ing.name;
                                                    const sources = ing.transformationOutputs?.map(o => o.transformation.sourceProduct.name);
                                                    if (sources && sources.length > 0) {
                                                        const uniqueSources = Array.from(new Set(sources));
                                                        displayName = `${uniqueSources.join(' / ')} - ${ing.name}`;
                                                    }
                                                    return {
                                                        value: ing.id,
                                                        label: displayName,
                                                        group: 'Despieces / Elaboraciones'
                                                    };
                                                })
                                            ]}
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
                                    if (selectedIng && selectedIng.transformationOutputs && selectedIng.transformationOutputs.length > 0) {
                                        return (
                                            <div className="flex-grow w-full md:w-auto">
                                                <select
                                                    className="block w-full rounded-md border-gray-200 text-sm text-gray-600"
                                                    value={item.sourceProductId || ''}
                                                    onChange={(e) => updateItem(index, 'sourceProductId', e.target.value)}
                                                >
                                                    <option value="">-- Origen Genérico --</option>
                                                    {selectedIng.transformationOutputs.map(output => (
                                                        <option key={output.transformation.sourceProduct.id} value={output.transformation.sourceProduct.id}>
                                                            {output.transformation.sourceProduct.supplier ? (
                                                                `${output.transformation.sourceProduct.supplier} - `
                                                            ) : ''}
                                                            {output.transformation.sourceProduct.name} ({output.percentage.toFixed(0)}%)
                                                        </option>
                                                    ))}
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
                                <div className="w-full md:w-24">
                                    <select
                                        className="block w-full rounded-md border-gray-200 text-sm"
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

                {/* ... Skipping to Steps List for replacement ... */}

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
            </div>
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
                    Guardar Receta
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

            {/* Structured Data / Tags */}
            <div className="ml-10 flex flex-wrap gap-2 items-center">
                <select
                    className="text-xs rounded border-gray-200 py-1 pl-2 pr-6"
                    value={step.action || ''}
                    onChange={(e) => updateStep('action', e.target.value)}
                >
                    <option value="">-- Acción --</option>
                    {Object.keys(ACTIONS).map(act => <option key={act} value={act}>{act}</option>)}
                </select>

                {step.action && ACTIONS[step.action] && (
                    <select
                        className="text-xs rounded border-gray-200 py-1 pl-2 pr-6"
                        value={step.subAction || ''}
                        onChange={(e) => updateStep('subAction', e.target.value)}
                    >
                        <option value="">-- Técnica --</option>
                        {ACTIONS[step.action].map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                )}

                <select
                    className="text-xs rounded border-gray-200 py-1 pl-2 pr-6 max-w-[150px]"
                    value={step.ingredientId || ''}
                    onChange={(e) => updateStep('ingredientId', e.target.value)}
                >
                    <option value="">-- Ingrediente Relacionado --</option>
                    {availableIngredients.map((ing: any) => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
