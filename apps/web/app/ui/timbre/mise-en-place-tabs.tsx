'use client';

import { useState } from 'react';
import { TimbreVisualizer } from '@/app/ui/timbre/timbre-visualizer';
import { MiseItemForm } from '@/app/ui/timbre/mise-item-form';
import { GastronormGuide } from '@/app/ui/timbre/gastronorm-guide';
import { Timbre, Shelf, MiseItem } from '@prisma/client';

export default function MiseEnPlaceTabs({
    timbre
}: {
    timbre: Timbre & { shelves: (Shelf & { items: MiseItem[] })[] }
}) {
    const [activeTab, setActiveTab] = useState<'configurator' | 'guide'>('configurator');

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-8 px-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('configurator')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'configurator'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        🛠️ Configurador de Timbre
                    </button>
                    <button
                        onClick={() => setActiveTab('guide')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'guide'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        📐 Guía de Medidas GN
                    </button>
                </nav>
            </div>

            <div className="p-6">
                {activeTab === 'configurator' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Input Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <MiseItemForm />

                            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                                <h4 className="font-bold mb-2">¿Cómo funciona?</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Añade tus partidas indicando volumen (Litros).</li>
                                    <li>El sistema calculará el tamaño GN ideal.</li>
                                    <li>Pulsa "Organizar" para que el algoritmo coloque cada GN en la balda más adecuada.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: Visualization */}
                        <div className="lg:col-span-2">
                            <TimbreVisualizer timbre={timbre} />
                        </div>
                    </div>
                ) : (
                    <GastronormGuide />
                )}
            </div>
        </div>
    );
}
