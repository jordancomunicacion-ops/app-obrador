'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface IssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    taskTitle: string;
}

export default function IssueModal({
    isOpen,
    onClose,
    onConfirm,
    taskTitle
}: IssueModalProps) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(reason);
        setReason('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-lg font-semibold text-red-600">Reportar Problema</h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
                        <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">
                            Estás marcando la tarea como <span className="font-semibold text-red-600">Problema</span>.
                            Por favor, indica el motivo:
                        </p>
                        <p className="text-sm font-medium text-gray-900 mb-4">{taskTitle}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Motivo del problema</label>
                        <textarea
                            required
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="Ej: Falta de ingredientes, maquinaria averiada..."
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Confirmar Problema
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
