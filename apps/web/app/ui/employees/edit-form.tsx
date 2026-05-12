'use client';

import { updateUser } from '@/app/lib/actions/employees';
import { UserFormState } from '@/app/lib/definitions';
import Link from 'next/link';
import {
    UserIcon,
    EnvelopeIcon,
    KeyIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useActionState } from 'react';
import { User } from '@prisma/client';

export default function EditForm({ user }: { user: any }) {
    // user: any used temporarily to avoid type errors if runtime types aren't fresh yet
    const initialState: UserFormState = { message: null, errors: {} };
    const updateUserWithId = updateUser.bind(null, user.id);
    const [state, formAction] = useActionState(updateUserWithId, initialState);

    return (
        <form action={formAction}>
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">

                {/* GRID LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* 1. Account Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Cuenta</h4>

                        {/* Name (Username) */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                defaultValue={user.name}
                                placeholder="Ej. jperez"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                aria-describedby="name-error"
                            />
                            <div id="name-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.name && state.errors.name.map((error: string) => (
                                    <p key={error} className="mt-1 text-xs text-red-500">{error}</p>
                                ))}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Acceso)</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={user.email}
                                placeholder="juan@cocina.com"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <div id="email-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.email && state.errors.email.map((error: string) => (
                                    <p key={error} className="mt-1 text-xs text-red-500">{error}</p>
                                ))}
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (Opcional)</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Dejar vacía para no cambiar"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Rol de Acceso</label>
                            <select
                                id="role"
                                name="role"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                defaultValue={user.role}
                            >
                                <option value="EMPLOYEE">Empleado</option>
                                <option value="CHEF">Jefe de Cocina</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                    </div>

                    {/* 2. Personal Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Datos Personales</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    name="firstName"
                                    defaultValue={user.firstName || ''}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                                <input
                                    name="lastName"
                                    defaultValue={user.lastName || ''}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">DNI / NIE</label>
                                <input
                                    name="dni"
                                    defaultValue={user.dni || ''}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">F. Nacimiento</label>
                                {/* Format date to YYYY-MM-DD for input type=date */}
                                <input
                                    name="dob"
                                    type="date"
                                    defaultValue={user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Job Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Ficha Técnica</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Puesto / Cargo</label>
                            <input
                                name="jobTitle"
                                defaultValue={user.jobTitle || ''}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Cocinero, Camarero..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Contacto</label>
                            <input
                                name="phone"
                                defaultValue={user.phone || ''}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* 4. Permissions Info */}
                    <div className="space-y-4 md:col-span-2 lg:col-span-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-1">Permisos de Acceso</h4>
                        <p className="text-xs text-gray-500 mb-2">Selecciona las secciones a las que este usuario tendrá acceso.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[
                                { id: 'dashboard', label: 'Dashboard' },
                                { id: 'events', label: 'Eventos' },
                                { id: 'tasks', label: 'Tareas' },
                                { id: 'menu-planning', label: 'Planificación' },
                                { id: 'products', label: 'Productos' },
                                { id: 'recipes', label: 'Recetas' },
                                { id: 'purchasing', label: 'Compras' },
                                { id: 'storage', label: 'Almacén' },
                                { id: 'mise-en-place', label: 'Mise en place' },
                                { id: 'obrador', label: 'Obrador' },
                                { id: 'employees', label: 'Empleados' },
                                { id: 'settings', label: 'Configuración' }
                            ].map(section => (
                                <label key={section.id} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="permissions"
                                        value={section.id}
                                        defaultChecked={user.permissions?.includes(section.id)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                                        {section.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                </div>

                <div aria-live="polite" aria-atomic="true">
                    {state.message && (
                        <p className="mt-4 text-sm text-red-500">{state.message}</p>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
                <Link
                    href="/dashboard/employees"
                    className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm"
                >
                    Actualizar Empleado
                </button>
            </div>
        </form>
    );
}
