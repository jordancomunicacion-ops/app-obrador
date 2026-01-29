'use client';

import { createTransformation, TransformationFormState } from '@/app/lib/actions/transformations';
import { useActionState, useState } from 'react';
import { Ingredient, SupplierProduct, TransformationOutput, Transformation } from '@prisma/client';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

type ExtendedIngredient = Ingredient & {
    transformationOutputs?: (TransformationOutput & {
        transformation: Transformation & {
            sourceProduct: SupplierProduct
        }
    })[]
};

type Props = {
    product: SupplierProduct;
    ingredients: ExtendedIngredient[];
};

type OutputRow = {
    key: string;
    ingredientId: string; // "NEW" or ID (can be empty if strictly using name)
    newIngredientName: string;
    weight: number | string;
    costAllocation: number | string;
};

export default function TransformationForm({ product, ingredients }: Props) {
    const initialState: TransformationFormState = { message: null, errors: {} };
    const [state, formAction] = useActionState(createTransformation, initialState);

    // Default Input Test Quantity (e.g. 1 unit/kg)
    const [testQuantity, setTestQuantity] = useState<number | string>(1);
    const [testUnit, setTestUnit] = useState<string>(product.unit || 'KG');

    const [outputs, setOutputs] = useState<OutputRow[]>([
        { key: '1', ingredientId: '', newIngredientName: '', weight: '', costAllocation: 1 }
    ]);

    const addOutput = () => {
        setOutputs([...outputs, { key: crypto.randomUUID(), ingredientId: '', newIngredientName: '', weight: '', costAllocation: 1 }]);
    };

    const removeOutput = (index: number) => {
        const newOutputs = [...outputs];
        newOutputs.splice(index, 1);
        setOutputs(newOutputs);
    };

    const updateOutput = (index: number, field: keyof OutputRow, value: any) => {
        const newOutputs = [...outputs];
        newOutputs[index] = { ...newOutputs[index], [field]: value };
        setOutputs(newOutputs);
    };

    // Derived Calculations
    const totalOutputWeight = outputs.reduce((sum, row) => sum + (Number(row.weight) || 0), 0);
    const yieldPercentage = Number(testQuantity) > 0 ? (totalOutputWeight / Number(testQuantity)) * 100 : 0;

    return (
        <form action={formAction}>
            <input type="hidden" name="sourceProductId" value={product.id} />
            {/* Pass complex object as JSON */}
            <input type="hidden" name="outputs" value={JSON.stringify(outputs)} />

            <div className="rounded-md bg-gray-50 p-4 md:p-6 mb-6">


                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Nombre de la Transformación</label>
                    <input
                        name="name"
                        type="text"
                        placeholder="Ej. Limpieza Standard, Despiece Completo..."
                        className="w-full rounded-md border-gray-200 py-2 pl-4 text-sm"
                    />
                    <div id="name-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.name && state.errors.name.map((error: string) => (
                            <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Cantidad del Test</label>
                    <div className="flex items-center gap-2">
                        <input
                            name="testQuantity"
                            type="number"
                            step="any"
                            value={testQuantity}
                            onChange={(e) => setTestQuantity(e.target.value)}
                            className="w-32 rounded-md border-gray-200 py-2 pl-4 text-sm"
                        />
                        <select
                            name="testUnit"
                            value={testUnit}
                            onChange={(e) => setTestUnit(e.target.value)}
                            className="rounded-md border-gray-200 py-2 pl-4 text-sm bg-gray-50"
                        >
                            <option value="KG">KG</option>
                            <option value="L">L</option>
                            <option value="UD">UD</option>
                        </select>
                        <span className="text-sm text-gray-500">( de {product.name} )</span>
                    </div>
                    <div id="testQuantity-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.testQuantity && state.errors.testQuantity.map((error: string) => (
                            <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-md bg-white border border-gray-200 p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Desglose (Salidas)</h3>
                    <div className="text-sm">
                        <span className={`font-bold ${Math.abs(100 - yieldPercentage) < 1 ? 'text-green-600' : 'text-orange-500'}`}>
                            Rendimiento Total: {yieldPercentage.toFixed(1)}%
                        </span>
                        <span className="text-gray-400 mx-2">|</span>
                        <span>Total Peso: {totalOutputWeight.toFixed(3)} {testUnit}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase">
                        <div className="col-span-5">Ingrediente Resultante</div>
                        <div className="col-span-2">Peso Obtenido</div>
                        <div className="col-span-2">Factor Coste</div>
                        <div className="col-span-2">Rendimiento</div>
                        <div className="col-span-1"></div>
                    </div>

                    {outputs.map((row, index) => {
                        const weightNum = Number(row.weight) || 0;
                        const rowPercentage = Number(testQuantity) > 0 ? (weightNum / Number(testQuantity)) * 100 : 0;

                        return (
                            <div key={row.key} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                                {/* Ingredient Selection (Input with Datalist) */}
                                <div className="col-span-5">
                                    <input
                                        type="text"
                                        list={`ingredients-${index}`}
                                        className="w-full rounded border-gray-200 text-sm py-1"
                                        placeholder="Nombre del ingrediente (ej. Solomillo Limpio)"
                                        value={row.newIngredientName}
                                        onChange={(e) => updateOutput(index, 'newIngredientName', e.target.value)}
                                    />
                                    <datalist id={`ingredients-${index}`}>
                                        {ingredients.map(ing => {
                                            let displayName = ing.name;
                                            if (ing.transformationOutputs && ing.transformationOutputs.length > 0 && ing.transformationOutputs[0].transformation?.sourceProduct) {
                                                const sourceName = ing.transformationOutputs[0].transformation.sourceProduct.name;
                                                // Avoid double prefixing if name already contains source
                                                if (!displayName.toLowerCase().includes(sourceName.toLowerCase())) {
                                                    displayName = `${sourceName} - ${ing.name}`;
                                                }
                                            }
                                            return <option key={ing.id} value={displayName} />;
                                        })}
                                    </datalist>
                                    <input type="hidden" value={row.ingredientId} />
                                </div>

                                {/* Weight */}
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border-gray-200 text-sm py-1"
                                        value={row.weight}
                                        onChange={(e) => updateOutput(index, 'weight', e.target.value)}
                                    />
                                </div>

                                {/* Cost Factor */}
                                <div className="col-span-2 relative group">
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="w-full rounded border-gray-200 text-sm py-1"
                                        value={row.costAllocation}
                                        onChange={(e) => updateOutput(index, 'costAllocation', e.target.value)}
                                    />
                                    {/* Tooltip */}
                                    <div className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-800 text-white text-xs p-2 rounded z-20 mb-1 shadow-lg">
                                        Asigna valor: <br />
                                        <strong>1</strong> = Normal (Proporcional)<br />
                                        <strong>0</strong> = Merma (Sin valor)<br />
                                        <strong>1.5</strong> = Parte noble (Más cara)<br />
                                        <strong>0.5</strong> = Recorte (Más barato)
                                    </div>
                                </div>

                                {/* Percentage (Read only) */}
                                <div className="col-span-2 text-center text-sm font-medium">
                                    {rowPercentage.toFixed(1)}%
                                </div>

                                {/* Delete */}
                                <div className="col-span-1 flex justify-end">
                                    <button type="button" onClick={() => removeOutput(index)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="w-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4">
                    <button type="button" onClick={addOutput} className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                        <PlusIcon className="w-4" /> Añadir Salida
                    </button>
                </div>
            </div>

            <div aria-live="polite" aria-atomic="true" className="mt-4">
                {state.message && (
                    <p className="text-sm text-red-500">{state.message}</p>
                )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
                <button
                    type="submit"
                    className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Guardar Transformación
                </button>
            </div>
        </form>
    );
}
