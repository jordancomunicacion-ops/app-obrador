import { PencilIcon, PlusIcon, TrashIcon, ClipboardDocumentListIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteEvent, confirmEvent } from '@/app/lib/actions/events';

export function ConfirmEvent({ id }: { id: string }) {
    return (
        <form
            action={async () => {
                'use server';
                await confirmEvent(id);
            }}
        >
            <button
                className="rounded-md border p-2 hover:bg-green-100 text-green-600"
                title="Confirmar Evento"
            >
                <span className="sr-only">Confirmar</span>
                <CheckIcon className="w-5" />
            </button>
        </form>
    );
}

export function CreateEvent() {
    return (
        <Link
            href="/dashboard/events/create"
            className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
            <span className="hidden md:block">Nuevo Evento</span>
            <PlusIcon className="h-5 md:ml-4" />
        </Link>
    );
}

export function UpdateEvent({ id }: { id: string }) {
    return (
        <Link
            href={`/dashboard/events/${id}/edit`}
            className="rounded-md border p-2 hover:bg-gray-100"
        >
            <PencilIcon className="w-5" />
        </Link>
    );
}

export function DeleteEvent({ id }: { id: string }) {
    return (
        <form
            action={async () => {
                'use server';
                await deleteEvent(id);
            }}
        >
            <button className="rounded-md border p-2 hover:bg-gray-100">
                <span className="sr-only">Delete</span>
                <TrashIcon className="w-5" />
            </button>
        </form>
    );
}

export function ViewShoppingList({ id }: { id: string }) {
    return (
        <Link
            href={`/dashboard/events/${id}/shopping-list`}
            className="rounded-md border p-2 hover:bg-gray-100 text-blue-600"
            title="Lista de Compra"
        >
            <ClipboardDocumentListIcon className="w-5" />
        </Link>
    );
}
