'use client';

import { useState, useEffect } from 'react';
import { Partition, Shelf, Recommendation } from '@/app/lib/timbre/types';
import { generateAllRecommendations } from '@/app/lib/timbre/recommendations';
import { SHELF_PRESETS, getCompatiblePresets, ShelfPreset } from '@/app/lib/timbre/presets';
import { TimbreConfig } from '@/app/ui/timbre/timbre-config';
import { PartitionForm } from '@/app/ui/timbre/partition-form';
import { RecommendationDisplay } from '@/app/ui/timbre/recommendation-display';
import { PresetSelector } from '@/app/ui/timbre/preset-selector';

export default function MiseEnPlacePage() {
    const [shelves, setShelves] = useState<Shelf[]>([
        { id: '1', availableHeight: 150, containers: [] },
        { id: '2', availableHeight: 150, containers: [] },
        { id: '3', availableHeight: 150, containers: [] },
        { id: '4', availableHeight: 150, containers: [] },
    ]);

    const [partitions, setPartitions] = useState<Partition[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [compatiblePresets, setCompatiblePresets] = useState<ShelfPreset[]>([]);
    const [activeTab, setActiveTab] = useState<'configurator' | 'guide'>('configurator');

    // Update compatible presets when shelves change
    useEffect(() => {
        const maxHeight = Math.max(...shelves.map(s => s.availableHeight));
        const presets = getCompatiblePresets(maxHeight);
        setCompatiblePresets(presets);
    }, [shelves]);

    // Update recommendations when partitions or shelves change
    useEffect(() => {
        if (partitions.length > 0) {
            const recs = generateAllRecommendations(partitions, shelves);
            setRecommendations(recs);
        } else {
            setRecommendations([]);
        }
    }, [partitions, shelves]);

    const handlePartitionAdd = (partition: Partition) => {
        setPartitions([...partitions, partition]);
    };

    const handlePresetSelect = (preset: ShelfPreset) => {
        console.log('Preset seleccionado:', preset);
        // TODO: Apply preset to a shelf
        alert(`Preset "${preset.name}" seleccionado. (Funcionalidad de aplicación en desarrollo)`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
                <h1 className="text-2xl font-bold text-gray-900">Mise en Place</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Sistema de configuración de timbres con recomendaciones automáticas de contenedores Gastronorm
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex gap-8 px-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('configurator')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'configurator'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            🛠️ Configurador de Timbre
                        </button>
                        <button
                            onClick={() => setActiveTab('guide')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'guide'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            📐 Guía de Medidas GN
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'configurator' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Configuration */}
                            <div className="space-y-6">
                                <TimbreConfig onShelvesChange={setShelves} />

                                <PresetSelector
                                    presets={compatiblePresets}
                                    onPresetSelect={handlePresetSelect}
                                />

                                <PartitionForm onPartitionAdd={handlePartitionAdd} />
                            </div>

                            {/* Right Column: Recommendations */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4">
                                    Recomendaciones
                                    {partitions.length > 0 && (
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({partitions.length} partida{partitions.length !== 1 ? 's' : ''})
                                        </span>
                                    )}
                                </h2>
                                <RecommendationDisplay recommendations={recommendations} />
                            </div>
                        </div>
                    ) : (
                        <GastronormGuide />
                    )}
                </div>
            </div>
        </div>
    );
}

// Original Gastronorm Guide Component (kept for reference)
function GastronormGuide() {
    const [volumeInput, setVolumeInput] = useState('');
    const [recommendedGN, setRecommendedGN] = useState<string | null>(null);

    const gnSizes = [
        { id: '1/9', name: 'GN 1/9', dim: '176 x 108 mm', capacity: 1, color: 'bg-purple-100 border-purple-300 ring-purple-500' },
        { id: '1/6', name: 'GN 1/6', dim: '176 x 162 mm', capacity: 1.6, color: 'bg-red-100 border-red-300 ring-red-500' },
        { id: '1/4', name: 'GN 1/4', dim: '265 x 162 mm', capacity: 2.8, color: 'bg-orange-100 border-orange-300 ring-orange-500' },
        { id: '1/3', name: 'GN 1/3', dim: '325 x 176 mm', capacity: 4, color: 'bg-yellow-100 border-yellow-300 ring-yellow-500' },
        { id: '1/2', name: 'GN 1/2', dim: '325 x 265 mm', capacity: 6.5, color: 'bg-green-100 border-green-300 ring-green-500' },
        { id: '2/3', name: 'GN 2/3', dim: '354 x 325 mm', capacity: 9, color: 'bg-teal-100 border-teal-300 ring-teal-500' },
        { id: '1/1', name: 'GN 1/1', dim: '530 x 325 mm', capacity: 14, color: 'bg-blue-100 border-blue-300 ring-blue-500' },
    ];

    const calculateRecommendedGN = () => {
        const vol = parseFloat(volumeInput);
        if (isNaN(vol) || vol <= 0) {
            setRecommendedGN(null);
            return;
        }

        const suitable = gnSizes.sort((a, b) => a.capacity - b.capacity).find(gn => gn.capacity >= vol);

        if (suitable) {
            setRecommendedGN(suitable.id);
        } else {
            setRecommendedGN('1/1');
        }
    };

    const isHighlighted = (id: string) => recommendedGN === id;
    const isDimmed = (id: string) => recommendedGN !== null && recommendedGN !== id;

    return (
        <div className="space-y-6">
            {/* Calculator Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-base font-semibold leading-6 text-gray-900 mb-2">Calculadora de Volumen</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Introduce el volumen (L) o peso aprox (Kg) para recibir una recomendación.
                </p>
                <div className="flex gap-4">
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Ej: 2.5"
                        value={volumeInput}
                        onChange={(e) => setVolumeInput(e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2"
                    />
                    <button
                        onClick={calculateRecommendedGN}
                        className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        Calcular
                    </button>
                </div>
            </div>

            {/* Visual Guide */}
            <div className="flex flex-col md:flex-row gap-4 h-[800px] md:h-[600px] w-full">
                {/* Column 1: GN 1/1 */}
                <div className="flex-1 flex flex-col">
                    <div
                        className={`
                            flex-[530] w-full relative rounded-xl border-2 p-6 flex flex-col justify-center items-center transition-all duration-300
                            ${gnSizes.find(g => g.id === '1/1')?.color}
                            ${isHighlighted('1/1') ? 'ring-4 scale-[1.02] z-10 shadow-xl opacity-100' : ''}
                            ${isDimmed('1/1') ? 'opacity-40 grayscale blur-[1px]' : ''}
                        `}
                    >
                        <span className="text-6xl font-bold text-gray-800">GN 1/1</span>
                        <span className="text-xl text-gray-600 mt-4">530 x 325 mm</span>
                    </div>
                </div>

                {/* Column 2: GN 1/3 & 2/3 */}
                <div className="flex-1 flex flex-col gap-4">
                    <div
                        className={`
                            flex-[176] w-full rounded-xl border-2 p-2 flex flex-col justify-center items-center transition-all duration-300
                            ${gnSizes.find(g => g.id === '1/3')?.color}
                            ${isHighlighted('1/3') ? 'ring-4 scale-[1.02] z-10 shadow-xl opacity-100' : ''}
                            ${isDimmed('1/3') ? 'opacity-40 grayscale blur-[1px]' : ''}
                        `}
                    >
                        <span className="text-3xl font-bold text-gray-800">1/3</span>
                        <span className="text-sm text-gray-600">325 x 176 mm</span>
                    </div>

                    <div
                        className={`
                            flex-[354] w-full rounded-xl border-2 p-4 flex flex-col justify-center items-center transition-all duration-300
                            ${gnSizes.find(g => g.id === '2/3')?.color}
                            ${isHighlighted('2/3') ? 'ring-4 scale-[1.02] z-10 shadow-xl opacity-100' : ''}
                            ${isDimmed('2/3') ? 'opacity-40 grayscale blur-[1px]' : ''}
                        `}
                    >
                        <span className="text-4xl font-bold text-gray-800">2/3</span>
                        <span className="text-sm text-gray-600">354 x 325 mm</span>
                    </div>
                </div>

                {/* Column 3: GN 1/2 & Bottom Section */}
                <div className="flex-1 flex flex-col gap-4">
                    <div
                        className={`
                            flex-[265] w-full rounded-xl border-2 p-4 flex flex-col justify-center items-center transition-all duration-300
                            ${gnSizes.find(g => g.id === '1/2')?.color}
                            ${isHighlighted('1/2') ? 'ring-4 scale-[1.02] z-10 shadow-xl opacity-100' : ''}
                            ${isDimmed('1/2') ? 'opacity-40 grayscale blur-[1px]' : ''}
                        `}
                    >
                        <span className="text-4xl font-bold text-gray-800">1/2</span>
                        <span className="text-sm text-gray-600">325 x 265 mm</span>
                    </div>

                    <div className="flex-[265] w-full flex flex-row gap-4">
                        {/* Left: 1/4 */}
                        <div
                            className={`
                                flex-1 h-full rounded-xl border-2 p-2 flex flex-col justify-center items-center transition-all duration-300
                                ${gnSizes.find(g => g.id === '1/4')?.color}
                                ${isHighlighted('1/4') ? 'ring-4 scale-[1.02] z-10 shadow-xl opacity-100' : ''}
                                ${isDimmed('1/4') ? 'opacity-40 grayscale blur-[1px]' : ''}
                            `}
                        >
                            <span className="text-2xl font-bold text-gray-800">1/4</span>
                            <span className="text-xs text-gray-600">265 x 162 mm</span>
                        </div>

                        {/* Right: Stack 1/6 & 1/9 */}
                        <div className="flex-1 flex flex-col gap-4 h-full">
                            <div
                                className={`
                                    flex-[162] w-full rounded-lg border-2 p-1 flex flex-col justify-center items-center transition-all duration-300
                                    ${gnSizes.find(g => g.id === '1/6')?.color}
                                    ${isHighlighted('1/6') ? 'ring-4 scale-[1.1] z-10 shadow-xl opacity-100' : ''}
                                    ${isDimmed('1/6') ? 'opacity-40 grayscale blur-[1px]' : ''}
                                `}
                            >
                                <span className="text-xl font-bold text-gray-800">1/6</span>
                                <span className="text-[10px] text-gray-600">176x162</span>
                            </div>

                            <div
                                className={`
                                    flex-[108] w-full rounded-lg border-2 p-1 flex flex-col justify-center items-center transition-all duration-300
                                    ${gnSizes.find(g => g.id === '1/9')?.color}
                                    ${isHighlighted('1/9') ? 'ring-4 scale-[1.1] z-10 shadow-xl opacity-100' : ''}
                                    ${isDimmed('1/9') ? 'opacity-40 grayscale blur-[1px]' : ''}
                                `}
                            >
                                <span className="text-xl font-bold text-gray-800">1/9</span>
                                <span className="text-[10px] text-gray-600">176x108</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
