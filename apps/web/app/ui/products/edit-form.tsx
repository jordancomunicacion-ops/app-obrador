'use client';

import { updateProduct, ProductFormState } from '@/app/lib/actions/products';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { SupplierProduct } from '@prisma/client';

export default function EditForm({ product }: { product: SupplierProduct }) {
    const initialState: ProductFormState = { message: '', errors: {} };
    const updateProductWithId = updateProduct.bind(null, product.id);
    const [state, formAction] = useActionState(updateProductWithId, initialState);

    const [unit, setUnit] = useState(product.unit || 'KG');
    const isPack = unit === 'CAJA' || unit === 'PACK' || unit === 'BOTELLA';

    return (
        <form action={formAction}>
            <div className="rounded-md bg-gray-50 p-4 md:p-6">

                {/* Product Name */}
                <div className="mb-4">
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                        Nombre del Producto (Compra)
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        defaultValue={product.name}
                        placeholder="Ej. Solomillo Vaca Rubia"
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

                {/* Supplier */}
                <div className="mb-4">
                    <label htmlFor="supplier" className="mb-2 block text-sm font-medium">
                        Proveedor
                    </label>
                    <input
                        id="supplier"
                        name="supplierId"
                        type="text"
                        defaultValue={product.supplier || ''}
                        placeholder="Ej. Makro, Carnicería Pepe..."
                        className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                    />
                </div>

                {/* Price and Unit Grid */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="price" className="mb-2 block text-sm font-medium">
                            Precio de Compra (€)
                        </label>
                        <input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            defaultValue={product.price}
                            placeholder="0.00"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            aria-describedby="price-error"
                        />
                        <div id="price-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.price &&
                                state.errors.price.map((error: string) => (
                                    <p key={error} className="mt-2 text-sm text-red-500">
                                        {error}
                                    </p>
                                ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="unit" className="mb-2 block text-sm font-medium">
                            Unidad de Compra
                        </label>
                        <select
                            id="unit"
                            name="unit"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            defaultValue={product.unit}
                            onChange={(e) => setUnit(e.target.value)}
                        >
                            <option value="KG">KG</option>
                            <option value="L">Litros</option>
                            <option value="UD">Unidad</option>
                            <option value="CAJA">Caja</option>
                            <option value="PACK">Pack</option>
                            <option value="BOTELLA">Botella</option>
                        </select>
                    </div>
                </div>

                {isPack && (
                    <div className="mb-4">
                        <label htmlFor="quantityPerUnit" className="mb-2 block text-sm font-medium">
                            {unit === 'CAJA' ? 'Unidades/Kilos por Caja' :
                                unit === 'BOTELLA' ? 'Capacidad (ml)' : 'Unidades por Pack'}
                        </label>
                        <input
                            id="quantityPerUnit"
                            name="quantityPerUnit"
                            type="number"
                            step="0.01"
                            defaultValue={(product as any).quantityPerUnit}
                            placeholder={unit === 'BOTELLA' ? "Ej. 750" : "Ej. 12"}
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                        />
                    </div>
                )}

                {/* Sapiens World */}
                <div className="mb-4">
                    <label htmlFor="sapiensWorld" className="mb-2 block text-sm font-medium">
                        Mundo (Metodología Sapiens)
                    </label>
                    <select
                        id="sapiensWorld"
                        name="sapiensWorld"
                        className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                        defaultValue={product.sapiensWorld || ''}
                    >
                        <option value="">-- Seleccionar Mundo --</option>
                        <option value="Reino Animal">Reino Animal</option>
                        <option value="Reino Vegetal">Reino Vegetal</option>
                        <option value="Reino Fungi">Reino Fungi</option>
                        <option value="Mundo Mineral">Mundo Mineral</option>
                        <option value="Otros">Otros</option>
                    </select>
                </div>

                <div aria-live="polite" aria-atomic="true">
                    {state.message && (
                        <p className="mt-2 text-sm text-red-500">{state.message}</p>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
                <Link
                    href="/dashboard/products"
                    className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                    Cancelar
                </Link>
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
