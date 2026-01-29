'use client';

import { addMiseItem, autoArrangeItems } from '@/app/lib/actions/mise';
import { useTransition } from 'react';

export function MiseItemForm() {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (formData: FormData) => {
        startTransition(() => {
            addMiseItem(formData);
        });
    };

    const handleAutoArrange = () => {
        startTransition(async () => {
            await autoArrangeItems();
        });
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Añadir Nueva Partida</h3>

            <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre</label>
                        <input name="name" type="text" required placeholder="Ej. Cebolla picada"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Volumen (Litros)</label>
                        <input name="volume" type="number" step="0.1" required placeholder="Ej. 2.5"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Categoría</label>
                        <select name="category" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                            <option value="topping">Topping (Salsas, Nueces)</option>
                            <option value="garnish">Garnish (Hierbas, Decoración)</option>
                            <option value="medium">Mise en place (Verduras)</option>
                            <option value="large">Producción (Caldos, Bases)</option>
                            <option value="production">Almacenaje (Bloques)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ritmo de Servicio</label>
                        <select name="serviceRhythm" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                            <option value="bajo">Bajo (Reposición lenta)</option>
                            <option value="medio" selected>Medio</option>
                            <option value="alto">Alto (Necesita rapidez)</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isPending ? 'Añadiendo...' : 'Añadir Partida'}
                    </button>

                    <button
                        type="button"
                        onClick={handleAutoArrange}
                        disabled={isPending}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        ⚡ Organizar Todo Automáticamente
                    </button>
                </div>
            </form>
        </div>
    );
}
