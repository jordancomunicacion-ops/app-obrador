'use client';

import { createTask } from '@/app/lib/actions/tasks';
import type { TaskFormState } from '@/app/lib/definitions';
import Link from 'next/link';
import {
    UserIcon,
    DocumentTextIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useActionState } from 'react';
import { User, Recipe } from '@prisma/client';

export default function Form({ users, recipes }: { users: User[], recipes: Recipe[] }) {
    const initialState: TaskFormState = { message: null, errors: {} };
    const [state, formAction] = useActionState(createTask, initialState);

    return (
        <form action={formAction}>
            <div className="rounded-md bg-gray-50 p-4 md:p-6">

                {/* Title */}
                <div className="mb-4">
                    <label htmlFor="title" className="mb-2 block text-sm font-medium">
                        Título de la Tarea
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <input
                            id="title"
                            name="title"
                            type="text"
                            placeholder="Ej. Cortar verduras evento Boda"
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                            aria-describedby="title-error"
                        />
                        <div id="title-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.title &&
                                state.errors.title.map((error: string) => (
                                    <p key={error} className="mt-2 text-sm text-red-500">
                                        {error}
                                    </p>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label htmlFor="description" className="mb-2 block text-sm font-medium">
                        Descripción / Instrucciones
                    </label>
                    <div className="relative mt-2 rounded-md">
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="Detalles sobre la tarea..."
                            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                        />
                        <DocumentTextIcon className="pointer-events-none absolute left-3 top-3 h-[18px] w-[18px] text-gray-500 peer-focus:text-gray-900" />
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Assigned To */}
                    <div>
                        <label htmlFor="assignedToUserId" className="mb-2 block text-sm font-medium">
                            Asignar a
                        </label>
                        <div className="relative">
                            <select
                                id="assignedToUserId"
                                name="assignedToUserId"
                                className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                defaultValue=""
                            >
                                <option value="" disabled>Seleccionar Empleado</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                    </div>

                    {/* Linked Recipe (Optional) */}
                    <div>
                        <label htmlFor="recipeId" className="mb-2 block text-sm font-medium">
                            Receta Relacionada (Opcional)
                        </label>
                        <div className="relative">
                            <select
                                id="recipeId"
                                name="recipeId"
                                className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                defaultValue=""
                            >
                                <option value="">Ninguna</option>
                                {recipes.map((recipe) => (
                                    <option key={recipe.id} value={recipe.id}>
                                        {recipe.name}
                                    </option>
                                ))}
                            </select>
                            <ClipboardDocumentCheckIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Planned Start */}
                    <div>
                        <label htmlFor="plannedStart" className="mb-2 block text-sm font-medium">
                            Inicio Planificado
                        </label>
                        <div className="relative">
                            <input
                                type="datetime-local"
                                id="plannedStart"
                                name="plannedStart"
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            />
                            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                    </div>
                    {/* Planned End */}
                    <div>
                        <label htmlFor="plannedEnd" className="mb-2 block text-sm font-medium">
                            Fin Planificado
                        </label>
                        <div className="relative">
                            <input
                                type="datetime-local"
                                id="plannedEnd"
                                name="plannedEnd"
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                            />
                            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                        </div>
                    </div>
                </div>

                <div aria-live="polite" aria-atomic="true">
                    {state.message && (
                        <p className="mt-2 text-sm text-red-500">{state.message}</p>
                    )}
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <Link
                    href="/dashboard/tasks"
                    className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    Crear Tarea
                </button>
            </div>
        </form>
    );
}
