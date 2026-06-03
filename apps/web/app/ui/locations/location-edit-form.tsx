"use client";

import { useState, useTransition } from "react";
import { updateLocation, deleteLocation } from "@/app/lib/actions/locations";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

type Location = {
    id: string;
    name: string;
    shortCode: string | null;
    address: string | null;
    isActive: boolean;
    companyName: string | null;
    nif: string | null;
    phone: string | null;
    email: string | null;
    activity: string | null;
    registryType: string | null;
    registryNumber: string | null;
    registryStatus: string | null;
    region: string | null;
};

export default function LocationEditForm({ location }: { location: Location }) {
    const router = useRouter();
    const [saving, startSaving] = useTransition();
    const [deleting, startDeleting] = useTransition();

    async function onSubmit(fd: FormData) {
        startSaving(async () => {
            await updateLocation(location.id, fd);
            router.refresh();
        });
    }

    function onDelete() {
        if (!confirm(`¿Eliminar el local "${location.name}"? Esta acción no se puede deshacer.`)) return;
        startDeleting(async () => {
            await deleteLocation(location.id);
            router.push("/dashboard/settings");
            router.refresh();
        });
    }

    const inp = "mt-1 w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
    const lbl = "flex flex-col text-xs font-semibold text-gray-700";

    return (
        <form action={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className={lbl}>
                    Nombre *
                    <input name="name" required defaultValue={location.name} className={inp} />
                </label>
                <label className={lbl}>
                    Código corto
                    <input name="shortCode" maxLength={10} defaultValue={location.shortCode ?? ""} className={inp} />
                </label>
                <label className={lbl + " md:col-span-2"}>
                    Dirección
                    <input name="address" defaultValue={location.address ?? ""} className={inp} />
                </label>
            </div>

            <div className="border-t border-gray-100 pt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Datos de establecimiento (etiquetado y registro sanitario)
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className={lbl}>Razón social<input name="companyName" defaultValue={location.companyName ?? ""} className={inp} /></label>
                    <label className={lbl}>NIF / CIF<input name="nif" defaultValue={location.nif ?? ""} className={inp} /></label>
                    <label className={lbl}>Teléfono<input name="phone" defaultValue={location.phone ?? ""} className={inp} /></label>
                    <label className={lbl}>Email<input name="email" type="email" defaultValue={location.email ?? ""} className={inp} /></label>
                    <label className={lbl}>Actividad<input name="activity" defaultValue={location.activity ?? ""} className={inp} /></label>
                    <label className={lbl}>Tipo registro<input name="registryType" defaultValue={location.registryType ?? ""} className={inp} /></label>
                    <label className={lbl}>Nº registro sanitario<input name="registryNumber" defaultValue={location.registryNumber ?? ""} className={inp} /></label>
                    <label className={lbl}>Estado registro
                        <select name="registryStatus" defaultValue={location.registryStatus ?? "no_iniciado"} className={inp}>
                            <option value="no_iniciado">No iniciado</option>
                            <option value="solicitado">Solicitado</option>
                            <option value="concedido">Concedido</option>
                            <option value="denegado">Denegado</option>
                        </select>
                    </label>
                    <label className={lbl}>Comunidad autónoma<input name="region" defaultValue={location.region ?? ""} className={inp} /></label>
                </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox" name="isActive" defaultChecked={location.isActive} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Local activo
            </label>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar local
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {saving ? "Guardando..." : "Guardar cambios"}
                </button>
            </div>
        </form>
    );
}
