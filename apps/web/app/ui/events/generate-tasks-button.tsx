'use client';

import { generateTasksForEvent } from '@/app/lib/actions/events';
import { useTransition } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function GenerateTasksButton({
    eventId,
    disabled
}: {
    eventId: string,
    disabled: boolean
}) {
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(async () => {
            const result = await generateTasksForEvent(eventId);
            if (result.message) {
                alert(result.message); // Simple feedback for now
            }
        });
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || isPending}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors
                ${disabled || isPending
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500'}`}
        >
            {isPending ? (
                <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Generando...
                </>
            ) : (
                <>
                    <ArrowPathIcon className="w-5 h-5" />
                    Generar Tareas
                </>
            )}
        </button>
    );
}
