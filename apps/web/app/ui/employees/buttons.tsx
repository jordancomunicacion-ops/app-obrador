'use client';

import { PencilIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import clsx from 'clsx';
import { deleteUser } from '@/app/lib/actions/employees';
import { updateUserStatus } from '@/app/lib/user-actions';

export function CreateEmployee() {
    return (
        <Link
            href="/dashboard/employees/create"
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-95"
        >
            <PlusIcon className="h-5 w-5 stroke-[3px]" />
            <span>Nuevo Empleado</span>
        </Link>
    );
}

export function UpdateEmployee({ id, theme = 'blue' }: { id: string; theme?: 'blue' | 'orange' }) {
    return (
        <Link
            href={`/dashboard/employees/${id}/edit`}
            className={clsx(
                "flex items-center gap-1.5 text-xs font-bold transition-colors",
                theme === 'blue' ? "text-blue-600 hover:text-blue-700" : "text-green-500 hover:text-green-600"
            )}
        >
            <PencilIcon className="w-4 stroke-[3px]" />
            <span>Editar Ficha</span>
        </Link>
    );
}

export function DeleteEmployee({ id }: { id: string }) {
    const handleAction = async () => {
        if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            await deleteUser(id);
        }
    };

    return (
        <form action={handleAction}>
            <button type="submit" className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors">
                <TrashIcon className="w-4 stroke-[3px]" />
                <span>Eliminar</span>
            </button>
        </form>
    );
}

export function ToggleApproval({ id, approved, theme = 'blue' }: { id: string; approved: boolean; theme?: 'blue' | 'orange' }) {
    const handleAction = async () => {
        await updateUserStatus(id, !approved);
    };

    return (
        <form action={handleAction}>
            <button
                type="submit"
                className={clsx(
                    'text-xs font-bold transition-all',
                    {
                        'text-blue-600 hover:text-blue-700': !approved && theme === 'blue',
                        'text-orange-500 hover:text-orange-600': !approved && theme === 'orange',
                        'text-red-500 hover:text-red-600': approved,
                    }
                )}
            >
                {approved ? 'Bloquear' : 'Aprobar'}
            </button>
        </form>
    );
}
