'use client';

import { useState } from 'react';
import { Shelf } from '@/app/lib/timbre/types';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface TimbreConfigProps {
    onShelvesChange: (shelves: Shelf[]) => void;
}

export function TimbreConfig({ onShelvesChange }: TimbreConfigProps) {
    const [numShelves, setNumShelves] = useState(4);
    const [shelves, setShelves] = useState<Shelf[]>([
        { id: '1', availableHeight: 150, containers: [] },
        { id: '2', availableHeight: 150, containers: [] },
        { id: '3', availableHeight: 150, containers: [] },
        { id: '4', availableHeight: 150, containers: [] },
    ]);

    const addShelf = () => {
        const newShelf: Shelf = {
            id: String(shelves.length + 1),
            availableHeight: 150,
            containers: []
        };
        const updated = [...shelves, newShelf];
        setShelves(updated);
        setNumShelves(updated.length);
        onShelvesChange(updated);
    };

    const removeShelf = () => {
        if (shelves.length > 1) {
            const updated = shelves.slice(0, -1);
            setShelves(updated);
            setNumShelves(updated.length);
            onShelvesChange(updated);
        }
    };

    const updateShelfHeight = (shelfId: string, height: number) => {
        const updated = shelves.map(shelf =>
            shelf.id === shelfId ? { ...shelf, availableHeight: height } : shelf
        );
        setShelves(updated);
        onShelvesChange(updated);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Configuración del Timbre</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={removeShelf}
                        disabled={shelves.length <= 1}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Eliminar balda"
                    >
                        <MinusIcon className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-600">{numShelves} baldas</span>
                    <button
                        onClick={addShelf}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Añadir balda"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {shelves.map((shelf, index) => (
                    <div key={shelf.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 w-20">
                            Balda {shelf.id}
                        </span>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">
                                Altura libre (mm)
                            </label>
                            <input
                                type="number"
                                value={shelf.availableHeight}
                                onChange={(e) => updateShelfHeight(shelf.id, parseInt(e.target.value) || 0)}
                                min={50}
                                max={300}
                                step={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="text-xs text-gray-500">
                            {shelf.availableHeight < 90 && '⚠️ Muy bajo'}
                            {shelf.availableHeight >= 90 && shelf.availableHeight < 125 && '✓ 65mm'}
                            {shelf.availableHeight >= 125 && shelf.availableHeight < 175 && '✓ 100mm'}
                            {shelf.availableHeight >= 175 && shelf.availableHeight < 225 && '✓ 150mm'}
                            {shelf.availableHeight >= 225 && '✓ 200mm'}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                    💡 <strong>Regla:</strong> Altura contenedor + 25mm (margen) ≤ Altura libre de la balda
                </p>
            </div>
        </div>
    );
}
