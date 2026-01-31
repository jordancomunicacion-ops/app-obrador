'use client';

import { createEvent, EventFormState } from '@/app/lib/actions/events';
import Link from 'next/link';
import {
    CalendarIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { useActionState, useState } from 'react';
import { Recipe } from '@prisma/client';

type MenuItemInput = {
    key: string;
    recipeId: string;
    servingsOverride: number | null;
};

export default function Form({ recipes }: { recipes: Recipe[] }) {
    const initialState: EventFormState = { message: null, errors: {} };
    const [state, formAction] = useActionState(createEvent, initialState);

    const [menuItems, setMenuItems] = useState<MenuItemInput[]>([]);

    const addItem = () => {
        setMenuItems([
            ...menuItems,
            {
                key: crypto.randomUUID(),
                recipeId: '',
                servingsOverride: null,
            },
        ]);
    };

    const removeItem = (index: number) => {
        const newItems = [...menuItems];
        newItems.splice(index, 1);
        setMenuItems(newItems);
    };

    const updateItem = (index: number, field: keyof MenuItemInput, value: any) => {
        const newItems = [...menuItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setMenuItems(newItems);
    };

    return (
        <form action={formAction}>
            <div className="rounded-md bg-gray-50 p-4 md:p-6">
                <input type="hidden" name="menuItems" value={JSON.stringify(menuItems)} />

                {/* Event Name */}
                <div className="mb-4">
                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                        Nombre del Evento
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <input
                            id="name"
                            name="name"
                            type="text"
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

                {/* Date */}
                <div className="mb-4">
                    <label htmlFor="date" className="mb-2 block text-sm font-medium">
                        Fecha
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <input
                            id="date"
                            name="date"
                            type="date"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            aria-describedby="date-error"
                        />
                        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                    </div>
                    <div id="date-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.date &&
                            state.errors.date.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-4">
                    {/* Pax */}
                    <div>
                        <label htmlFor="pax" className="mb-2 block text-sm font-medium">
                            Pax (Comensales)
                        </label>
                        <div className="relative mt-2 rounded-md">
                            <input
                                id="pax"
                                name="pax"
                                type="number"
                                placeholder=""
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                aria-describedby="pax-error"
                            />
                            <UserGroupIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                        <div id="pax-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.pax &&
                                state.errors.pax.map((error: string) => (
                                    <p key={error} className="mt-2 text-sm text-red-500">
                                        {error}
                                    </p>
                                ))}
                        </div>
                    </div>

                    {/* Safety Margin */}
                    <div>
                        <label htmlFor="safetyMargin" className="mb-2 block text-sm font-medium">
                            Margen Seguridad
                        </label>
                        <div className="relative mt-2 rounded-md">
                            <input
                                id="safetyMargin"
                                name="safetyMargin"
                                type="number"
                                step="0.05"
                                defaultValue="1.1"
                                placeholder=""
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                aria-describedby="safetyMargin-error"
                            />
                            <ShieldCheckIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                        <div id="safetyMargin-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.safetyMargin &&
                                state.errors.safetyMargin.map((error: string) => (
                                    <p key={error} className="mt-2 text-sm text-red-500">
                                        {error}
                                    </p>
                                ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">1.1 = +10% extra comida</p>
                    </div>
                </div>

                {/* Menu Selection */}
                <div className="mb-4 mt-8">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">Menú del Evento</h3>
                        <button type="button" onClick={addItem} className="flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-sm text-blue-600 hover:bg-blue-200">
                            <PlusIcon className="w-4" /> Añadir Plato
                        </button>
                    </div>
                    {menuItems.length === 0 && <p className="text-gray-500 italic text-sm">No hay platos en el menú.</p>}

                    <div className="space-y-2">
                        {menuItems.map((item, index) => (
                            <div key={item.key} className="flex flex-col md:flex-row gap-2 items-start md:items-center p-3 bg-white rounded border border-gray-200">
                                {/* Recipe Select */}
                                <div className="flex-grow w-full md:w-auto">
                                    <select
                                        className="block w-full rounded-md border-gray-200 text-sm"
                                        value={item.recipeId}
                                        onChange={(e) => updateItem(index, 'recipeId', e.target.value)}
                                    >
                                        <option value="">Seleccionar Receta...</option>
                                        {recipes.map(recipe => (
                                            <option key={recipe.id} value={recipe.id}>{recipe.name} ({recipe.yieldQuantity} rac.)</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Pax Override */}
                                <div className="w-full md:w-32">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder=""
                                            className="block w-full rounded-md border-gray-200 py-2 pl-2 text-sm outline-2 placeholder:text-gray-500"
                                            value={item.servingsOverride || ''}
                                            onChange={(e) => updateItem(index, 'servingsOverride', e.target.value === '' ? null : Number(e.target.value))}
                                        />
                                        <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">platos</p>
                                    </div>
                                </div>
                                {/* Remove Action */}
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1">
                                    <TrashIcon className="w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div id="menuItems-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.menuItems &&
                            state.errors.menuItems.map((error: string) => (
                                <p key={error} className="mt-2 text-sm text-red-500">
                                    {error}
                                </p>
                            ))}
                    </div>
                </div>

                <div aria-live="polite" aria-atomic="true">
                    {state.message && (
                        <p className="mt-2 text-sm text-red-500">{state.message}</p>
                    )}
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <Link
                    href="/dashboard/events"
                    className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Guardar Evento
                </button>
            </div>
        </form>
    );
}
