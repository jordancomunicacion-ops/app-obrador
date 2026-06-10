"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
    BuildingStorefrontIcon,
    KeyIcon,
    UserGroupIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { setActiveLocation } from "@/app/lib/actions/locations";

/**
 * Tarjeta de un local en la lista "Locales". Al pulsarla fija ese local como
 * activo (cookie + topbar) y entra en su detalle, de modo que las secciones
 * internas (proveedores, clientes, documentación) ya filtran por este local.
 */
export default function LocationEnterCard({
    id,
    name,
    shortCode,
    address,
    isActive,
    hasKey,
    empCount,
}: {
    id: string;
    name: string;
    shortCode: string | null;
    address: string | null;
    isActive: boolean;
    hasKey: boolean;
    empCount: number;
}) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const enter = () =>
        startTransition(async () => {
            await setActiveLocation(id);
            router.push(`/dashboard/settings/locations/${id}`);
        });

    return (
        <button
            type="button"
            onClick={enter}
            disabled={isPending}
            className={clsx(
                "group flex w-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-emerald-200 hover:shadow-md",
                isPending && "opacity-50",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <BuildingStorefrontIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-gray-900">{name}</h3>
                        <p className="truncate text-xs text-gray-500">
                            {shortCode ? `${shortCode} · ` : ""}
                            {address || "Sin dirección"}
                        </p>
                    </div>
                </div>
                {!isActive && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        Inactivo
                    </span>
                )}
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                    <KeyIcon className="h-4 w-4" />
                    <span className={hasKey ? "font-semibold text-emerald-700" : ""}>
                        {hasKey ? "API key activa" : "Sin API key"}
                    </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <UserGroupIcon className="h-4 w-4" />
                    {empCount} {empCount === 1 ? "empleado" : "empleados"}
                </span>
                <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-emerald-600" />
            </div>
        </button>
    );
}
