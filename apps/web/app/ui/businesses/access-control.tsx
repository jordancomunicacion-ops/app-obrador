"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    PlusIcon,
    TrashIcon,
    EnvelopeIcon,
    KeyIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
    removeBusinessAccess,
    updateBusinessAccess,
    type AccessPermissions,
} from "@/app/lib/actions/businesses";

type Business = { id: string; name: string };

type Access = {
    id: string;
    email: string;
    businessId: string;
    canViewDashboard: boolean;
    canViewEvents: boolean;
    canViewTasks: boolean;
    canViewCommunications: boolean;
    canViewCatalog: boolean;
    canViewOperations: boolean;
    canViewObrador: boolean;
    canViewEmployees: boolean;
    canManageDirectory: boolean;
    canEditSettings: boolean;
    createdAt: string;
    updatedAt: string;
};

const PERMISSION_LABELS: { key: keyof AccessPermissions; label: string; hint: string }[] = [
    { key: "canViewDashboard", label: "Dashboard", hint: "Inicio + 'Hoy'" },
    { key: "canViewEvents", label: "Eventos", hint: "Calendario y eventos" },
    { key: "canViewTasks", label: "Tareas", hint: "Tareas y rutinas" },
    { key: "canViewCommunications", label: "Comunicaciones", hint: "Avisos y mensajes" },
    { key: "canViewCatalog", label: "Catálogo", hint: "Productos, recetas, menú" },
    { key: "canViewOperations", label: "Operaciones", hint: "Compras, almacén, mise, etiquetas" },
    { key: "canViewObrador", label: "Obrador", hint: "Producción y controles sanitarios" },
    { key: "canViewEmployees", label: "Empleados", hint: "Gestión de usuarios" },
    { key: "canManageDirectory", label: "Directorio", hint: "Proveedores y clientes" },
    { key: "canEditSettings", label: "Configuración", hint: "Ajustes, empresas, accesos" },
];

const DEFAULT_NEW: AccessPermissions = {
    canViewDashboard: true,
    canViewEvents: true,
    canViewTasks: true,
    canViewCommunications: true,
    canViewCatalog: true,
    canViewOperations: true,
    canViewObrador: true,
    canViewEmployees: false,
    canManageDirectory: false,
    canEditSettings: false,
};

export default function AccessControl({
    businesses,
    selectedBusinessId,
    initialAccesses,
}: {
    businesses: Business[];
    selectedBusinessId: string | null;
    initialAccesses: Access[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [accesses, setAccesses] = useState<Access[]>(initialAccesses);
    const [pending, startTransition] = useTransition();
    const [showAdd, setShowAdd] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPerms, setNewPerms] = useState<AccessPermissions>({ ...DEFAULT_NEW });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setAccesses(initialAccesses);
    }, [initialAccesses]);

    const onSelectBusiness = (id: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("empresa", id);
        router.push(`/dashboard/settings/accesos?${params.toString()}`);
    };

    const togglePerm = (access: Access, key: keyof AccessPermissions) => {
        if (!selectedBusinessId) return;
        const newVal = !access[key];
        // Optimistic update
        setAccesses((prev) => prev.map((a) => (a.id === access.id ? { ...a, [key]: newVal } : a)));
        startTransition(async () => {
            const res = await updateBusinessAccess(selectedBusinessId, access.email, { [key]: newVal });
            if (!res.success) {
                alert(res.error);
                // Revertir
                setAccesses((prev) => prev.map((a) => (a.id === access.id ? { ...a, [key]: !newVal } : a)));
            }
        });
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusinessId) return;
        setError(null);
        if (!newEmail.trim() || !newEmail.includes("@")) {
            setError("Email inválido.");
            return;
        }
        if (newPassword && newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (accesses.some((a) => a.email.toLowerCase() === newEmail.trim().toLowerCase())) {
            setError("Ya hay un acceso para ese email.");
            return;
        }
        startTransition(async () => {
            const res = await updateBusinessAccess(
                selectedBusinessId,
                newEmail.trim().toLowerCase(),
                newPerms,
                newPassword || undefined,
            );
            if (!res.success || !res.access) {
                setError(res.error || "No se pudo conceder el acceso.");
                return;
            }
            setAccesses((prev) => [
                ...prev,
                { ...res.access, createdAt: res.access.createdAt.toISOString(), updatedAt: res.access.updatedAt.toISOString() } as Access,
            ]);
            setNewEmail("");
            setNewPassword("");
            setNewPerms({ ...DEFAULT_NEW });
            setShowAdd(false);
            router.refresh();
        });
    };

    const handleRevoke = (a: Access) => {
        if (!confirm(`¿Revocar el acceso de ${a.email}?`)) return;
        startTransition(async () => {
            const res = await removeBusinessAccess(a.id);
            if (!res.success) {
                alert(res.error);
                return;
            }
            setAccesses((prev) => prev.filter((it) => it.id !== a.id));
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Empresa:</label>
                <select
                    value={selectedBusinessId ?? ""}
                    onChange={(e) => onSelectBusiness(e.target.value)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                    {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                        </option>
                    ))}
                </select>
                <div className="ml-auto">
                    <button
                        type="button"
                        onClick={() => setShowAdd((v) => !v)}
                        className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                        disabled={!selectedBusinessId || pending}
                    >
                        <PlusIcon className="h-5 w-5 stroke-[3px]" />
                        Conceder acceso
                    </button>
                </div>
            </div>

            {showAdd && (
                <form
                    onSubmit={handleAdd}
                    className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5"
                >
                    <h3 className="text-base font-bold text-gray-900">Nuevo acceso</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">Email *</label>
                            <div className="relative">
                                <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="cliente@ejemplo.com"
                                    className="block w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-700">
                                Contraseña <span className="font-normal text-gray-400">(crea/actualiza el usuario)</span>
                            </label>
                            <div className="relative">
                                <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mín. 6 caracteres"
                                    className="block w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Permisos</p>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            {PERMISSION_LABELS.map(({ key, label, hint }) => (
                                <label
                                    key={key}
                                    className={clsx(
                                        "flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 text-sm transition-colors",
                                        newPerms[key] ? "border-indigo-300 ring-1 ring-indigo-100" : "border-gray-200",
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={newPerms[key]}
                                        onChange={(e) => setNewPerms({ ...newPerms, [key]: e.target.checked })}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900">{label}</div>
                                        <div className="text-xs text-gray-500">{hint}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAdd(false)}
                            disabled={pending}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {pending ? "Guardando..." : "Conceder acceso"}
                        </button>
                    </div>
                </form>
            )}

            {accesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
                    <p className="text-sm font-semibold text-gray-700">Sin accesos</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Nadie tiene acceso a esta empresa todavía. Concédele a alguien para empezar.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Email</th>
                                {PERMISSION_LABELS.map((p) => (
                                    <th key={p.key} className="px-2 py-3 text-center" title={p.hint}>
                                        {p.label}
                                    </th>
                                ))}
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {accesses.map((a) => (
                                <tr key={a.id} className="border-b border-gray-50 last:border-0">
                                    <td className="px-4 py-3 font-medium text-gray-900">{a.email}</td>
                                    {PERMISSION_LABELS.map((p) => (
                                        <td key={p.key} className="px-2 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={a[p.key]}
                                                onChange={() => togglePerm(a, p.key)}
                                                disabled={pending}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleRevoke(a)}
                                            disabled={pending}
                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            Revocar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
