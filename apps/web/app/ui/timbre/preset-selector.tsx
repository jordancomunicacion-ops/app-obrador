'use client';

import { ShelfPreset } from '@/app/lib/timbre/presets';

interface PresetSelectorProps {
    presets: ShelfPreset[];
    onPresetSelect: (preset: ShelfPreset) => void;
}

export function PresetSelector({ presets, onPresetSelect }: PresetSelectorProps) {
    if (presets.length === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                ⚠️ No hay presets compatibles con las alturas configuradas. Aumenta la altura de las baldas.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Configuraciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presets.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => onPresetSelect(preset)}
                        className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-800 group-hover:text-blue-600">
                                {preset.name}
                            </h4>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                ≥{preset.minHeight}mm
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{preset.description}</p>
                        <div className="flex gap-2 flex-wrap">
                            {preset.containers.map((c, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {c.count}× {c.size} @ {c.depth}mm
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">{preset.use}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
