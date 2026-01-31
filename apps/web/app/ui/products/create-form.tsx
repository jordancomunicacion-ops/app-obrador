'use client';

import { createProduct, ProductFormState } from '@/app/lib/actions/products';
import Link from 'next/link';
import { useActionState, useState } from 'react';

export default function Form() {
    const initialState: ProductFormState = { message: '', errors: {} };
    const [state, formAction] = useActionState(createProduct, initialState);

    const [suppliers, setSuppliers] = useState([
        { supplierName: '', price: 0, unit: 'KG', quantityPerUnit: null }
    ]);

    const addSupplier = () => {
        setSuppliers([...suppliers, { supplierName: '', price: 0, unit: 'KG', quantityPerUnit: null }]);
    };

    const removeSupplier = (index: number) => {
        if (suppliers.length > 1) {
            setSuppliers(suppliers.filter((_, i) => i !== index));
        }
    };

    const updateSupplier = (index: number, field: string, value: any) => {
        const newSuppliers = [...suppliers];
        (newSuppliers[index] as any)[field] = value;
        setSuppliers(newSuppliers);
    };

    return (
        <form action={formAction}>
            <input type="hidden" name="suppliersJson" value={JSON.stringify(suppliers)} />

            <div className="rounded-md bg-white p-4 md:p-6 border border-gray-200 shadow-sm mb-6">
                <h2 className="text-lg font-bold mb-4 border-b pb-2">Información del Producto</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Product Name */}
                    <div className="mb-4">
                        <label htmlFor="name" className="mb-2 block text-sm font-medium">
                            Nombre del Producto (Genérico)
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Ej. Solomillo de Vaca"
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

                    {/* Category */}
                    <div className="mb-4">
                        <label htmlFor="category" className="mb-2 block text-sm font-medium">
                            Categoría / Familia
                        </label>
                        <select
                            id="category"
                            name="category"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            defaultValue=""
                        >
                            <option value="" disabled>-- Seleccionar Categoría --</option>
                            <option value="Carnes">Carnes</option>
                            <option value="Pescados">Pescados</option>
                            <option value="Mariscos / Moluscos">Mariscos / Moluscos</option>
                            <option value="Lácteos">Lácteos</option>
                            <option value="Verduras">Verduras</option>
                            <option value="Frutas">Frutas</option>
                            <option value="Cereales / Legumbres">Cereales / Legumbres</option>
                            <option value="Aceites / Grasas">Aceites / Grasas</option>
                            <option value="Especias / Condimentos">Especias / Condimentos</option>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>

                    {/* Sapiens World */}
                    <div className="mb-4">
                        <label htmlFor="sapiensWorld" className="mb-2 block text-sm font-medium">
                            Mundo (Sapiens)
                        </label>
                        <select
                            id="sapiensWorld"
                            name="sapiensWorld"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            defaultValue=""
                        >
                            <option value="" disabled>-- Seleccionar Mundo --</option>
                            <option value="Reino Animal">Reino Animal</option>
                            <option value="Reino Vegetal">Reino Vegetal</option>
                            <option value="Reino Fungi">Reino Fungi</option>
                            <option value="Mundo Mineral">Mundo Mineral</option>
                            <option value="Agua">Agua</option>
                            <option value="Elaborados / Mixto">Elaborados / Mixto</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-md bg-white p-4 md:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h2 className="text-lg font-bold">Proveedores y Precios</h2>
                    <button
                        type="button"
                        onClick={addSupplier}
                        className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors font-medium border border-blue-200"
                    >
                        + Añadir Proveedor
                    </button>
                </div>

                <div id="suppliers-error" aria-live="polite" aria-atomic="true">
                    {state.errors?.suppliers &&
                        state.errors.suppliers.map((error: string) => (
                            <p key={error} className="mb-4 text-sm text-red-500">
                                {error}
                            </p>
                        ))}
                </div>

                <div className="space-y-4">
                    {suppliers.map((s, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100 relative group">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase">
                                        Proveedor
                                    </label>
                                    <input
                                        type="text"
                                        value={s.supplierName}
                                        onChange={(e) => updateSupplier(index, 'supplierName', e.target.value)}
                                        placeholder="Ej. Makro, Carnicería Pepe..."
                                        className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase">
                                        Precio (€)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={s.price}
                                        onChange={(e) => updateSupplier(index, 'price', e.target.value)}
                                        placeholder="0.00"
                                        className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase">
                                        Unidad
                                    </label>
                                    <select
                                        value={s.unit}
                                        onChange={(e) => updateSupplier(index, 'unit', e.target.value)}
                                        className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
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

                            {(s.unit === 'CAJA' || s.unit === 'PACK' || s.unit === 'BOTELLA') && (
                                <div className="mt-4 max-w-xs">
                                    <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase">
                                        {s.unit === 'CAJA' ? 'Unidades/Kilos por Caja' :
                                            s.unit === 'BOTELLA' ? 'Capacidad (ml)' : 'Unidades por Pack'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={s.quantityPerUnit || ''}
                                        onChange={(e) => updateSupplier(index, 'quantityPerUnit', e.target.value)}
                                        placeholder={s.unit === 'BOTELLA' ? "Ej. 750" : "Ej. 12"}
                                        className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
                                    />
                                </div>
                            )}

                            {suppliers.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeSupplier(index)}
                                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-red-200 shadow-sm"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div aria-live="polite" aria-atomic="true">
                {state.message && (
                    <p className="mt-4 text-sm text-red-500">{state.message}</p>
                )}
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
                    Guardar Producto
                </button>
            </div>
        </form>
    );
}
