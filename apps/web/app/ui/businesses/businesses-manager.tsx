"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    BuildingOffice2Icon,
    CheckCircleIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
    createBusiness,
    deleteBusiness,
    setSelectedBusinessId,
    updateBusiness,
} from "@/app/lib/actions/businesses";

type Business = {
    id: string;
    name: string;
    domain: string | null;
    logoUrl: string | null;
    createdAt: string;
};

type FormState = { id?: string; name: string; domain: string; logoUrl: string };
const emptyForm: FormState = { name: "", domain: "", logoUrl: "" };

export default function BusinessesManager({
    initial,
    currentId,
}: {
    initial: Business[];
    currentId: string | null;
}) {
    const router = useRouter();
    const [items, setItems] = useState<Business[]>(initial);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const openCreate = () => {
        setForm(emptyForm);
        setError(null);
        setOpen(true);
    };
    const openEdit = (b: Business) => {
        setForm({ id: b.id, name: b.name, domain: b.domain ?? "", logoUrl: b.logoUrl ?? "" });
        setError(null);
        setOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }
        startTransition(async () => {
            const data = {
                name: form.name.trim(),
                domain: form.domain.trim() || undefined,
                logoUrl: form.logoUrl.trim() || undefined,
            };
            const res = form.id ? await updateBusiness(form.id, data) : await createBusiness(data);
            if (!res.success) {
                setError(res.error || "No se pudo guardar.");
                return;
            }
            setOpen(false);
            router.refresh();
        });
    };

    const handleDelete = (b: Business) => {
        if (
            !confirm(
                `¿Eliminar "${b.name}"? Se borrarán también sus accesos. Esta acción no se puede deshacer.`,
            )
        )
            return;
        startTransition(async () => {
            const res = await deleteBusiness(b.id);
            if (!res.success) {
                alert(res.error);
                return;
            }
            setItems((prev) => prev.filter((it) => it.id !== b.id));
            router.refresh();
        });
    };

    const handleSetActive = (b: Business) => {
        if (b.id === currentId) return;
        startTransition(async () => {
            const res = await setSelectedBusinessId(b.id);
            if (!res.success) {
                alert(res.error);
                return;
            }
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    {items.length} {items.length === 1 ? "empresa" : "empresas"} registrada{items.length === 1 ? "" : "s"}.
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
                    disabled={pending}
                >
                    <PlusIcon className="h-5 w-5 stroke-[3px]" />
                    Nueva empresa
                </button>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                    <BuildingOffice2Icon className="h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm font-semibold text-gray-700">Aún no hay empresas</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Crea la primera para empezar a operar y conceder accesos a tus clientes.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((b) => {
                        const isActive = b.id === currentId;
                        return (
                            <div
                                key={b.id}
                                className={clsx(
                                    "group relative flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-all",
                                    isActive ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-100 hover:shadow-md",
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <BuildingOffice2Icon className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-base font-bold text-gray-900">{b.name}</h3>
                                            <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                                                <GlobeAltIcon className="h-3.5 w-3.5" />
                                                {b.domain || "(sin dominio)"}
                                            </p>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                                            <CheckCircleIcon className="h-3 w-3" />
                                            Activa
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 border-t border-gray-50 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSetActive(b)}
                                        disabled={isActive || pending}
                                        className={clsx(
                                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                                            isActive
                                                ? "bg-gray-100 text-gray-400 cursor-default"
                                                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                                        )}
                                    >
                                        {isActive ? "Activa" : "Hacer activa"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openEdit(b)}
                                        disabled={pending}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Editar
                                    </button>
                                    <Link
                                        href={`/dashboard/settings/accesos?empresa=${b.id}`}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                    >
                                        <ShieldCheckIcon className="h-4 w-4" />
                                        Accesos
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(b)}
                                        disabled={pending}
                                        className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !pending && setOpen(false)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-1 text-lg font-bold text-gray-900">
                            {form.id ? "Editar empresa" : "Nueva empresa"}
                        </h2>
                        <p className="mb-6 text-sm text-gray-500">
                            {form.id
                                ? "Actualiza los datos del negocio."
                                : "Crea un negocio; después concédele acceso a quien lo gestione."}
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre *</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Obrador Soto del Prior"
                                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">
                                    Dominio <span className="font-normal text-gray-400">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.domain}
                                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                                    placeholder="obrador-sotodelprior.com"
                                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">
                                    URL del logo <span className="font-normal text-gray-400">(opcional)</span>
                                </label>
                                <input
                                    type="url"
                                    value={form.logoUrl}
                                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
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
                                    {pending ? "Guardando..." : form.id ? "Guardar cambios" : "Crear empresa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
