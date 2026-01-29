'use client';

import { useState } from 'react';
import { Partition, PartitionType, VolumeLevel, ServiceRhythm } from '@/app/lib/timbre/types';

interface PartitionFormProps {
    onPartitionAdd: (partition: Partition) => void;
}

export function PartitionForm({ onPartitionAdd }: PartitionFormProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<PartitionType>('medium');
    const [volumeLevel, setVolumeLevel] = useState<VolumeLevel>('medio');
    const [serviceRhythm, setServiceRhythm] = useState<ServiceRhythm>('medio');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const newPartition: Partition = {
            id: Date.now().toString(),
            name: name.trim(),
            type,
            volumeLevel,
            serviceRhythm
        };

        onPartitionAdd(newPartition);
        setName('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nueva Partida</h3>

            <div className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la partida
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Cebolla brunoise, Salsa tomate..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de partida
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as PartitionType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="topping">Topping / Hierba / Micro</option>
                        <option value="garnish">Guarnición pequeña / Salsa apoyo</option>
                        <option value="medium">Partida mediana (brunoise, sofrito)</option>
                        <option value="large">Partida grande (pasta, patata)</option>
                        <option value="production">Producción / Base grande</option>
                    </select>
                </div>

                {/* Volume Level */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nivel de volumen
                    </label>
                    <div className="flex gap-2">
                        {(['bajo', 'medio', 'alto'] as VolumeLevel[]).map(level => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => setVolumeLevel(level)}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${volumeLevel === level
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Service Rhythm */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ritmo de servicio
                    </label>
                    <div className="flex gap-2">
                        {(['bajo', 'medio', 'alto'] as ServiceRhythm[]).map(rhythm => (
                            <button
                                key={rhythm}
                                type="button"
                                onClick={() => setServiceRhythm(rhythm)}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${serviceRhythm === rhythm
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {rhythm.charAt(0).toUpperCase() + rhythm.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Obtener Recomendación
                </button>
            </div>
        </form>
    );
}
