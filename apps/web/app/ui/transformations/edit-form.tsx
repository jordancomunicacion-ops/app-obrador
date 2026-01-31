'use client';

import { updateTransformation, TransformationFormState } from '@/app/lib/actions/transformations';
import { useActionState, useState } from 'react';
import { Ingredient, SupplierProduct, Transformation, TransformationOutput, Ingredient as OutputIngredient, MasterProduct } from '@prisma/client';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

type ExtendedIngredient = Ingredient & {
    transformationOutputs?: (TransformationOutput & {
        transformation: Transformation & {
            sourceProduct: SupplierProduct
        }
    })[]
};

type ExtendedTransformation = Transformation & {
    outputs: (TransformationOutput & {
        ingredient: OutputIngredient
    })[];
};

type Props = {
    product: MasterProduct & { supplierProducts: SupplierProduct[] };
    transformation: ExtendedTransformation;
    ingredients: ExtendedIngredient[];
};

type OutputRow = {
    key: string;
    ingredientId: string;
    newIngredientName: string;
    weight: number | string;
    costAllocation: number | string;
};

export default function EditTransformationForm({ product, transformation, ingredients }: Props) {
    const initialState: TransformationFormState = { message: null, errors: {} };
    const updateAction = updateTransformation.bind(null, transformation.id);
    const [state, formAction] = useActionState(updateAction, initialState);

    const [selectedSupplierId, setSelectedSupplierId] = useState(transformation.sourceProductId || '');
    const selectedSupplier = product.supplierProducts.find(sp => sp.id === selectedSupplierId);

    // Initialize with existing data.
    const [testQuantity, setTestQuantity] = useState<number | string>(transformation.testQuantity);

    const [outputs, setOutputs] = useState<OutputRow[]>(
        transformation.outputs.map(o => ({
            key: o.id,
            ingredientId: o.ingredientId,
            newIngredientName: o.ingredient.name,
            weight: (o.percentage * transformation.testQuantity) / 100,
            costAllocation: o.costAllocation
        }))
    );

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

    const totalOutputWeight = outputs.reduce((sum, row) => sum + (Number(row.weight) || 0), 0);
    const testQtyNum = Number(testQuantity) || 0;
    const yieldPercentage = testQtyNum > 0 ? (totalOutputWeight / testQtyNum) * 100 : 0;

    return (
        <form action={formAction}>
            {/* Source Product Select */}
            <div className="rounded-md bg-blue-50 border border-blue-100 p-4 md:p-6 mb-6">
                <h3 className="text-sm font-semibold text-blue-800 uppercase mb-3">1. Proveedor utilizado en el Test</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="sourceProductId" className="block text-sm font-medium mb-1">Proveedor / Lote</label>
                        <select
                            id="sourceProductId"
                            name="sourceProductId"
                            value={selectedSupplierId}
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                            className="w-full rounded-md border-gray-200 py-2 pl-4 text-sm"
                            required
                        >
                            {product.supplierProducts.map(sp => (
                                <option key={sp.id} value={sp.id}>
                                    {sp.supplier} - {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(sp.price)} / {sp.unit}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <input type="hidden" name="outputs" value={JSON.stringify(outputs)} />
            <input type="hidden" name="testUnit" value={selectedSupplier?.unit || 'KG'} />

            <div className="rounded-md bg-gray-50 p-4 md:p-6 mb-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">2. Datos del Test</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Nombre de la Transformación</label>
                    <input
                        name="name"
                        type="text"
                        defaultValue={transformation.name}
                        placeholder="Ej. Limpieza Standard..."
                        className="w-full rounded-md border-gray-200 py-2 pl-4 text-sm"
                    />
                    {state.errors?.name && state.errors.name.map((error: string) => (
                        <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                    ))}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Cantidad Base para Recálculo</label>
                    <div className="flex items-center gap-2">
                        <input
                            name="testQuantity"
                            type="number"
                            step="any"
                            value={testQuantity}
                            onChange={(e) => setTestQuantity(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            className="w-32 rounded-md border-gray-200 py-2 pl-4 text-sm"
                        />
                        <span className="font-bold text-gray-600">{selectedSupplier?.unit || 'KG'}</span>
                    </div>
                    {state.errors?.testQuantity && state.errors.testQuantity.map((error: string) => (
                        <p key={error} className="mt-2 text-sm text-red-500">{error}</p>
                    ))}
                    <p className="text-xs text-gray-500 mt-1">
                        * Al editar, puedes ajustar la cantidad base para que los pesos de las salidas sean más cómodos de leer.
                    </p>
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
                        <span>Total Peso: {totalOutputWeight.toFixed(3)} {selectedSupplier?.unit || 'KG'}</span>
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
                        const rowPercentage = testQtyNum > 0 ? (weightNum / testQtyNum) * 100 : 0;

                        return (
                            <div key={row.key} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                                <div className="col-span-5">
                                    <input
                                        type="text"
                                        list={`ingredients-${index}`}
                                        className="w-full rounded border-gray-200 text-sm py-1"
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
                                </div>

                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        step="any"
                                        className="w-full rounded border-gray-200 text-sm py-1"
                                        value={row.weight}
                                        onChange={(e) => updateOutput(index, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="w-full rounded border-gray-200 text-sm py-1"
                                        value={row.costAllocation}
                                        onChange={(e) => updateOutput(index, 'costAllocation', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    />
                                </div>

                                <div className="col-span-2 text-center text-sm font-medium">
                                    {rowPercentage.toFixed(1)}%
                                </div>

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
                    <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded shadow-md">
                        <p className="text-sm text-red-700 font-bold mb-2">⚠ {state.message}</p>
                        {state.errors && Object.keys(state.errors).length > 0 && (
                            <div className="mt-2 p-2 bg-white rounded border border-red-200">
                                <p className="text-xs font-semibold text-red-800 mb-1">Detalles técnicos:</p>
                                <ul className="text-[10px] text-red-600 list-disc list-inside space-y-1">
                                    {Object.entries(state.errors).map(([field, errors]) => (
                                        <li key={field}><span className="font-bold uppercase">{field}:</span> {errors.join(', ')}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="mt-3 text-[10px] text-red-500 italic">
                            Tip: Si no ves los detalles técnicos arriba, asegúrate de haber reiniciado Docker con el botón TEST.bat.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
                <button
                    type="submit"
                    className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
}
