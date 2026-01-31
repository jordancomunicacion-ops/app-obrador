'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TaskAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (userId: string, date: string, time: string, duration: number) => void;
    users: User[];
    taskTitle: string;
    title?: string;
    confirmLabel?: string;
}

export default function TaskAssignmentModal({
    isOpen,
    onClose,
    onConfirm,
    users,
    taskTitle,
    title = "Empezar Tarea",
    confirmLabel = "Confirmar y Empezar"
}: TaskAssignmentModalProps) {
    const [userId, setUserId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00');
    const [duration, setDuration] = useState(60);

    // Set default date to today
    useEffect(() => {
        if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            // Default user to first one if available and none selected
            if (users && users.length > 0 && !userId) {
                setUserId(users[0].id);
            }
        }
    }, [isOpen, users, userId]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(userId, date, time, duration);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
                        <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-4">
                            <span className="font-medium text-gray-900">{taskTitle}</span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Trabajador</label>
                        <select
                            required
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="" disabled>Seleccionar trabajador</option>
                            {users?.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hora Inicio</label>
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Duración Estimada (min)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
