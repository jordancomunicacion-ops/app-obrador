"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    EnvelopeIcon,
    KeyIcon,
    PlusIcon,
    TrashIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
    addEmployeeToLocation,
    removeEmployeeFromLocation,
    updateEmploymentPermissions,
    updateEmploymentDepartment,
    type AccessPermissions,
    type DepartmentValue,
} from "@/app/lib/actions/location-employees";

type Employment = {
    id: string;
    position: string | null;
    department: DepartmentValue;
    canViewDashboard: boolean;
    canViewEvents: boolean;
    canViewTasks: boolean;
    canViewCommunications: boolean;
    canViewCatalog: boolean;
    canViewOperations: boolean;
    canViewObrador: boolean;
    canViewEcommerce: boolean;
    canViewEmployees: boolean;
    canManageDirectory: boolean;
    canEditSettings: boolean;
    canViewAllNotifications: boolean;
    user: {
        id: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        dni: string | null;
        jobTitle: string | null;
        role: string;
    };
};

const PERMISSION_LABELS: { key: keyof AccessPermissions; label: string; hint: string }[] = [
    { key: "canViewDashboard", label: "Dashboard", hint: "Inicio + 'Hoy'" },
    { key: "canViewEvents", label: "Eventos", hint: "Calendario y eventos" },
    { key: "canViewTasks", label: "Tareas", hint: "Tareas y rutinas" },
    { key: "canViewCommunications", label: "Comunicaciones", hint: "Avisos y mensajes" },
    { key: "canViewCatalog", label: "Catálogo", hint: "Productos, recetas, menú" },
    { key: "canViewOperations", label: "Operaciones", hint: "Compras, almacén, mise, etiquetas" },
    { key: "canViewObrador", label: "Obrador", hint: "Producción y controles sanitarios" },
    { key: "canViewEcommerce", label: "Ecommerce", hint: "Productos y pedidos de la tienda online" },
    { key: "canViewEmployees", label: "Empleados", hint: "Gestión de usuarios" },
    { key: "canManageDirectory", label: "Directorio", hint: "Proveedores y clientes" },
    { key: "canEditSettings", label: "Configuración", hint: "Ajustes, empresas, accesos" },
    { key: "canViewAllNotifications", label: "Supervisor", hint: "Ve todas las notificaciones de su área" },
];

const DEPARTMENT_OPTIONS: { value: DepartmentValue; label: string }[] = [
    { value: "GENERAL", label: "General" },
    { value: "SALA", label: "Sala" },
    { value: "COCINA", label: "Cocina" },
];

const DEFAULT_NEW: AccessPermissions = {
    canViewDashboard: true,
    canViewEvents: true,
    canViewTasks: true,
    canViewCommunications: true,
    canViewCatalog: true,
    canViewOperations: true,
    canViewObrador: true,
    canViewEcommerce: false,
    canViewEmployees: false,
    canManageDirectory: false,
    canEditSettings: false,
    canViewAllNotifications: false,
};

export default function LocationEmployees({
    locationId,
    initial,
}: {
    locationId: string;
    initial: Employment[];
}) {
    const router = useRouter();
    const [rows, setRows] = useState<Employment[]>(initial);
    const [pending, startTransition] = useTransition();
    const [showAdd, setShowAdd] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado del formulario "añadir"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dni, setDni] = useState("");
    const [position, setPosition] = useState("");
    const [department, setDepartment] = useState<DepartmentValue>("GENERAL");
    const [perms, setPerms] = useState<AccessPermissions>({ ...DEFAULT_NEW });

    function resetForm() {
        setEmail(""); setPassword(""); setFirstName(""); setLastName("");
        setDni(""); setPosition(""); setDepartment("GENERAL"); setPerms({ ...DEFAULT_NEW }); setError(null);
    }

    function togglePerm(emp: Employment, key: keyof AccessPermissions) {
        const newVal = !emp[key];
        setRows((prev) => prev.map((r) => (r.id === emp.id ? { ...r, [key]: newVal } : r)));
        startTransition(async () => {
            const res = await updateEmploymentPermissions(emp.id, { [key]: newVal });
            if (!res.ok) {
                alert(res.error);
                setRows((prev) => prev.map((r) => (r.id === emp.id ? { ...r, [key]: !newVal } : r)));
            }
        });
    }

    function changeDepartment(emp: Employment, value: DepartmentValue) {
        const prevVal = emp.department;
        setRows((prev) => prev.map((r) => (r.id === emp.id ? { ...r, department: value } : r)));
        startTransition(async () => {
            const res = await updateEmploymentDepartment(emp.id, value);
            if (!res.ok) {
                alert(res.error);
                setRows((prev) => prev.map((r) => (r.id === emp.id ? { ...r, department: prevVal } : r)));
            }
        });
    }

    function handleRemove(emp: Employment) {
        if (!confirm(`¿Quitar a ${emp.user.email} del local? Su contrato se mantendrá para histórico.`)) return;
        startTransition(async () => {
            const res = await removeEmployeeFromLocation(emp.id, locationId);
            if (!res.ok) { alert(res.error); return; }
            setRows((prev) => prev.filter((r) => r.id !== emp.id));
            router.refresh();
        });
    }

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!email.trim() || !email.includes("@")) {
            setError("Email inválido.");
            return;
        }
        if (password && password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        startTransition(async () => {
            const res = await addEmployeeToLocation(
                locationId,
                {
                    email: email.trim(),
                    password: password || undefined,
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    dni: dni || undefined,
                    position: position || undefined,
                    department,
                },
                perms,
            );
            if (!res.ok) { setError(res.error); return; }
            resetForm();
            setShowAdd(false);
            router.refresh();
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => { resetForm(); setShowAdd((v) => !v); }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    disabled={pending}
                >
                    <PlusIcon className="w-4 h-4 stroke-[3px]" />
                    Añadir empleado
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleAdd} className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <h3 className="text-base font-bold text-gray-900">Nuevo empleado</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Email *</label>
                            <div className="relative">
                                <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="empleado@ejemplo.com" className="block w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Contraseña (opcional si ya existe)</label>
                            <div className="relative">
                                <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mín. 6" className="block w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Nombre</label>
                            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Apellidos</label>
                            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">DNI</label>
                            <input value={dni} onChange={(e) => setDni(e.target.value)} className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Puesto</label>
                            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Cocinero, Ayudante..." className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Departamento</label>
                            <select value={department} onChange={(e) => setDepartment(e.target.value as DepartmentValue)} className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm">
                                {DEPARTMENT_OPTIONS.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Permisos en la app</p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            {PERMISSION_LABELS.map(({ key, label, hint }) => (
                                <label key={key} className={clsx("flex cursor-pointer items-start gap-3 rounded-md border bg-white p-2.5 text-sm", perms[key] ? "border-emerald-300 ring-1 ring-emerald-100" : "border-gray-200")}>
                                    <input type="checkbox" checked={perms[key]} onChange={(e) => setPerms({ ...perms, [key]: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                    <div>
                                        <div className="font-semibold text-gray-900">{label}</div>
                                        <div className="text-xs text-gray-500">{hint}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                    <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setShowAdd(false)} disabled={pending} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancelar</button>
                        <button type="submit" disabled={pending} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                            {pending ? "Guardando..." : "Añadir"}
                        </button>
                    </div>
                </form>
            )}

            {rows.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-sm text-gray-500">
                    Sin empleados asignados a este local. Usa "Añadir empleado" para conceder acceso.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-md border border-gray-100 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="py-2 pl-3 pr-2">Empleado</th>
                                <th className="px-1.5 py-2 text-center" title="Área de trabajo (define qué supervisor ve sus notificaciones)">Departamento</th>
                                {PERMISSION_LABELS.map((p) => (
                                    <th key={p.key} className="px-1.5 py-2 text-center" title={p.hint}>{p.label}</th>
                                ))}
                                <th className="py-2 pl-2 pr-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((e) => {
                                const fullName = ([e.user.firstName, e.user.lastName].filter(Boolean).join(" ") || e.user.name).trim();
                                return (
                                    <tr key={e.id} className="border-b border-gray-50 last:border-0">
                                        <td className="py-2 pl-3 pr-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                    <UserIcon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium text-gray-900">{fullName}</div>
                                                    <div className="truncate text-xs text-gray-500">{e.user.email}{e.position ? ` · ${e.position}` : ""}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-1.5 py-2 text-center">
                                            <select
                                                value={e.department}
                                                onChange={(ev) => changeDepartment(e, ev.target.value as DepartmentValue)}
                                                disabled={pending}
                                                className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                                            >
                                                {DEPARTMENT_OPTIONS.map((d) => (
                                                    <option key={d.value} value={d.value}>{d.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        {PERMISSION_LABELS.map((p) => (
                                            <td key={p.key} className="px-1.5 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={e[p.key]}
                                                    onChange={() => togglePerm(e, p.key)}
                                                    disabled={pending}
                                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                            </td>
                                        ))}
                                        <td className="py-2 pl-2 pr-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(e)}
                                                disabled={pending}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                Quitar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
