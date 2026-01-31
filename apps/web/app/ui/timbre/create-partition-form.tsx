'use client';

import { createPartition } from '@/app/lib/actions/timbre';
import { useTransition, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function CreatePartitionForm({ timbreId }: { timbreId: string }) {
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            await createPartition(formData);
            setIsOpen(false);
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
                <PlusIcon className="w-5 h-5" />
                Añadir Partida
            </button>
        );
    }

    return (
        <form action={handleSubmit} className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Nueva Partida / Configuración</h3>
            <input type="hidden" name="timbreId" value={timbreId} />

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="ej. Salsas Calientes"
                        required
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Partida</label>
                    <select
                        name="type"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="topping">Topping / Micro-prep</option>
                        <option value="garnish">Guarnición</option>
                        <option value="medium">Partida Media (Brunoise, etc.)</option>
                        <option value="large">Partida Grande (Base)</option>
                        <option value="production">Producción / Almacenaje</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Volumen</label>
                    <select
                        name="volumeLevel"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="bajo">Bajo (Poco espacio)</option>
                        <option value="medio">Medio</option>
                        <option value="alto">Alto (Mucho volumen)</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Ritmo de Servicio</label>
                    <select
                        name="serviceRhythm"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="bajo">Bajo (Uso ocasional)</option>
                        <option value="medio">Medio</option>
                        <option value="alto">Alto (Uso constante/rápido)</option>
                    </select>
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                    {isPending ? 'Guardando...' : 'Guardar Partida'}
                </button>
            </div>
        </form>
    );
}
