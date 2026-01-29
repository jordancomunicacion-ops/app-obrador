'use client';

import { Timbre, Shelf, MiseItem } from '@prisma/client';
import { updateShelfHeight, removeShelf } from '@/app/lib/actions/mise';
import { useTransition } from 'react';
import { MinusCircleIcon } from '@heroicons/react/24/outline';

interface TimbreVisualizerProps {
    timbre: Timbre & {
        shelves: (Shelf & { items: MiseItem[] })[];
    };
}

export function TimbreVisualizer({ timbre }: TimbreVisualizerProps) {
    const [isPending, startTransition] = useTransition();

    // Color mappings based on GN Size (Matching GastronormGuide)
    const getGNColor = (gn: string | null) => {
        const map: Record<string, string> = {
            '1/1': 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-500',
            '2/3': 'bg-teal-100 text-teal-800 border-teal-300 ring-1 ring-teal-500',
            '1/2': 'bg-green-100 text-green-800 border-green-300 ring-1 ring-green-500',
            '1/3': 'bg-yellow-100 text-yellow-800 border-yellow-300 ring-1 ring-yellow-500',
            '1/4': 'bg-orange-100 text-orange-800 border-orange-300 ring-1 ring-orange-500',
            '1/6': 'bg-red-100 text-red-800 border-red-300 ring-1 ring-red-500',
            '1/9': 'bg-purple-100 text-purple-800 border-purple-300 ring-1 ring-purple-500',
        };
        return map[gn || ''] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">{timbre.name} (Visualizador)</h2>

            <div className="flex flex-col gap-4 border-l-4 border-gray-300 pl-4 relative">
                {/* Scale/Ruler could go here */}

                {timbre.shelves.map((shelf) => (
                    <div key={shelf.id} className="relative group">
                        {/* Shelf Header */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Balda {shelf.position}</span>
                            <div className="flex items-center gap-2">
                                <span>{shelf.height}mm</span>
                                <input
                                    type="range"
                                    min="50" max="300" step="5"
                                    defaultValue={shelf.height}
                                    onChange={(e) => {
                                        // TODO: Debounce update
                                    }}
                                    className="w-20 h-1 accent-gray-500 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Shelf Container */}
                        <div
                            className="w-full bg-gray-50 border-t-4 border-gray-800 shadow-inner rounded-b-md relative flex items-end p-2 gap-2 overflow-x-auto min-h-[100px]"
                            style={{ height: `${Math.max(100, shelf.height)}px` }}
                        >
                            {shelf.items.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm select-none pointer-events-none">
                                    Vacío
                                </div>
                            )}

                            {shelf.items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`
                                        flex-shrink-0 relative flex flex-col items-center justify-center p-2 rounded-lg border-2 shadow-sm transition-all hover:scale-105 cursor-pointer
                                        ${getGNColor(item.assignedGN)}
                                    `}
                                    style={{
                                        // Approximate visual width based on GN size
                                        width: getWidthForGN(item.assignedGN),
                                        height: `${(item.assignedDepth || 100)}px`
                                    }}
                                    title={`${item.name} (${item.volume}L) - GN ${item.assignedGN} @ ${item.assignedDepth}mm`}
                                >
                                    <span className="font-bold text-lg leading-none">{item.assignedGN?.replace('GN ', '')}</span>
                                    <span className="text-[10px] font-medium opacity-80 mt-1 truncate w-full text-center px-1">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getWidthForGN(gn: string | null) {
    if (!gn) return '80px';
    const map: Record<string, string> = {
        '1/1': '320px',
        '2/3': '210px',
        '1/2': '160px',
        '1/3': '106px',
        '1/4': '80px',
        '1/6': '53px',
        '1/9': '35px'
    };
    return map[gn] || '80px';
}
