'use client';

import { useState } from 'react';

export function GastronormGuide() {
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
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-base font-semibold leading-6 text-gray-900 mb-2">Calculadora de Volumen</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Introduce el volumen (L) o peso aprox (Kg) para recibir una recomendación visual.
                </p>
                <div className="flex gap-4">
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Ej: 2.5"
                        value={volumeInput}
                        onChange={(e) => setVolumeInput(e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
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
            <div className="flex flex-col md:flex-row gap-4 h-[600px] w-full">
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
