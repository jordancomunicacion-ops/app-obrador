'use client';

import { createIngredient } from '@/app/lib/actions/inventory';
import type { IngredientFormState } from '@/app/lib/definitions';
import Link from 'next/link';
import {
    CurrencyEuroIcon,
    TagIcon,
    BeakerIcon,
    ScaleIcon,
} from '@heroicons/react/24/outline';
import { useActionState } from 'react';

export default function Form() {
    const initialState: IngredientFormState = { message: null, errors: {} };
    const [state, formAction] = useActionState(createIngredient, initialState);

    return (
        <form action={formAction}>
            <div className="rounded-md bg-gray-50 p-4 md:p-6">
                {/* Ingredient Name */}
                <div className="mb-4">
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                        Nombre del Ingrediente
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <div className="relative">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Ej. Cebolla, Aceite de Oliva..."
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                aria-describedby="name-error"
                            />
                            <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
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

                {/* Category */}
                <div className="mb-4">
                    <label htmlFor="category" className="mb-2 block text-sm font-medium">
                        Categoría
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <div className="relative">
                            <input
                                id="category"
                                name="category"
                                type="text"
                                placeholder="Ej. Verduras, Carnes, Lácteos..."
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            />
                            <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                    </div>
                </div>

                {/* Pricing Unit */}
                <div className="mb-4">
                    <label htmlFor="pricingUnit" className="mb-2 block text-sm font-medium">
                        Unidad de Precio
                    </label>
                    <div className="relative">
                        <select
                            id="pricingUnit"
                            name="pricingUnit"
                            className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            defaultValue="KG"
                            aria-describedby="pricingUnit-error"
                        >
                            <option value="" disabled>
                                Seleccione unidad
                            </option>
                            <option value="KG">KG (Kilogramos)</option>
                            <option value="G">G (Gramos)</option>
                            <option value="L">L (Litros)</option>
                            <option value="ML">ML (Mililitros)</option>
                            <option value="UD">UD (Unidades)</option>
                        </select>
                        <ScaleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                    </div>
                    <div id="pricingUnit-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.pricingUnit &&
                            state.errors.pricingUnit.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>

                {/* Price Per Unit */}
                <div className="mb-4">
                    <label htmlFor="pricePerUnit" className="mb-2 block text-sm font-medium">
                        Precio por Unidad (€)
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <div className="relative">
                            <input
                                id="pricePerUnit"
                                name="pricePerUnit"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                aria-describedby="pricePerUnit-error"
                            />
                            <CurrencyEuroIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                        <div id="pricePerUnit-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.pricePerUnit &&
                                state.errors.pricePerUnit.map((error: string) => (
                                    <p key={error} className="mt-2 text-sm text-red-500">
                                        {error}
                                    </p>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Yield Percent (Merma) */}
                <div className="mb-4">
                    <label htmlFor="yieldPercent" className="mb-2 block text-sm font-medium">
                        Rendimiento (%)
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <div className="relative">
                            <input
                                id="yieldPercent"
                                name="yieldPercent"
                                type="number"
                                step="0.1"
                                defaultValue="100"
                                max="100"
                                min="0"
                                placeholder="100"
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                aria-describedby="yieldPercent-error"
                            />
                            <BeakerIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                        <div id="yieldPercent-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.yieldPercent &&
                                state.errors.yieldPercent.map((error: string) => (
                                    <p key={error} className="mt-2 text-sm text-red-500">
                                        {error}
                                    </p>
                                ))}
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        100% = Sin merma. 80% = Se aprovecha el 80% del producto comprado.
                    </p>
                </div>

                {/* Allergens */}
                <div className="mb-4">
                    <label htmlFor="allergens" className="mb-2 block text-sm font-medium">
                        Alérgenos (separados por coma)
                    </label>
                    <input
                        id="allergens"
                        name="allergens"
                        type="text"
                        placeholder="Gluten, Leche, Huevos..."
                        className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
                    />
                </div>

                <div aria-live="polite" aria-atomic="true">
                    {state.message && (
                        <p className="mt-2 text-sm text-red-500">{state.message}</p>
                    )}
                </div>

            </div>
            <div className="mt-6 flex justify-end gap-4">
                <Link
                    href="/dashboard/inventory"
                    className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                    Cancelar
                </Link>
                <button type="submit" className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                    Guardar Ingrediente
                </button>
            </div>
        </form>
    );
}
