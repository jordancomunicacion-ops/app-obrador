'use client';

import { Recommendation } from '@/app/lib/timbre/types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface RecommendationDisplayProps {
    recommendations: Recommendation[];
}

export function RecommendationDisplay({ recommendations }: RecommendationDisplayProps) {
    if (recommendations.length === 0) {
        return (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                <p>Añade partidas para ver las recomendaciones</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {recommendations.map((rec) => (
                <div
                    key={rec.partition.id}
                    className={`rounded-lg border-2 p-4 transition-all ${rec.fits
                            ? 'bg-green-50 border-green-300'
                            : 'bg-red-50 border-red-300'
                        }`}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-lg">{rec.partition.name}</h4>
                            <p className="text-xs text-gray-600 mt-1">
                                {rec.partition.type} · Vol: {rec.partition.volumeLevel} · Servicio: {rec.partition.serviceRhythm}
                            </p>
                        </div>
                        {rec.fits ? (
                            <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        ) : (
                            <XCircleIcon className="w-6 h-6 text-red-600" />
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-3 p-3 bg-white rounded-lg">
                        <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">Tamaño recomendado</div>
                            <div className="text-2xl font-bold text-gray-800">GN {rec.gnSize}</div>
                        </div>
                        <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">Profundidad</div>
                            <div className="text-2xl font-bold text-gray-800">{rec.depth}mm</div>
                        </div>
                        {rec.shelfId && (
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Balda</div>
                                <div className="text-2xl font-bold text-blue-600">#{rec.shelfId}</div>
                            </div>
                        )}
                    </div>

                    <div className={`mt-3 text-sm p-2 rounded ${rec.fits ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {rec.reason}
                    </div>

                    {rec.alternatives && rec.alternatives.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500 mb-2">Alternativas:</div>
                            <div className="flex gap-2">
                                {rec.alternatives.map((alt, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                                    >
                                        GN {alt.gnSize}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
