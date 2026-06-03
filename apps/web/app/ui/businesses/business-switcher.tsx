"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BuildingOffice2Icon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { setSelectedBusinessId } from "@/app/lib/actions/businesses";

type Business = { id: string; name: string; domain: string | null; logoUrl: string | null };

const ALL_LABEL = "Todas las empresas";

export default function BusinessSwitcher({
    businesses,
    activeId,
    isPlatformOwner,
}: {
    businesses: Business[];
    activeId: string | null;
    /** Si true, mostramos la opción "Todas las empresas". */
    isPlatformOwner: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const active = businesses.find((b) => b.id === activeId) ?? null;
    const activeLabel = active ? active.name : isPlatformOwner ? ALL_LABEL : "—";

    function select(id: string | null) {
        startTransition(async () => {
            await setSelectedBusinessId(id);
            setOpen(false);
            router.refresh();
        });
    }

    // Si no hay nada que elegir, no renderizamos
    if (businesses.length === 0 && !isPlatformOwner) return null;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={isPending}
                className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors",
                    isPending && "opacity-50",
                )}
            >
                <BuildingOffice2Icon className="w-4 h-4 text-emerald-600" />
                <span className="truncate max-w-[180px]">{activeLabel}</span>
                <ChevronDownIcon className="w-3 h-3 text-gray-400" />
            </button>

            {open && (
                <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        Empresa activa
                    </div>

                    {isPlatformOwner && (
                        <button
                            type="button"
                            onClick={() => select(null)}
                            className={clsx(
                                "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors",
                                !active && "bg-emerald-50",
                            )}
                        >
                            <span className="font-medium text-gray-800">{ALL_LABEL}</span>
                            {!active && <CheckIcon className="w-4 h-4 text-emerald-600 flex-none" />}
                        </button>
                    )}

                    {businesses.map((b) => {
                        const isActive = b.id === active?.id;
                        return (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => select(b.id)}
                                className={clsx(
                                    "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors",
                                    isActive && "bg-emerald-50",
                                )}
                            >
                                <span className="flex flex-col min-w-0">
                                    <span className="font-medium text-gray-800 truncate">{b.name}</span>
                                    {b.domain && <span className="text-xs text-gray-400 truncate">{b.domain}</span>}
                                </span>
                                {isActive && <CheckIcon className="w-4 h-4 text-emerald-600 flex-none" />}
                            </button>
                        );
                    })}

                    {businesses.length === 0 && (
                        <div className="px-3 py-4 text-center text-xs text-gray-500">
                            Sin empresas. Crea una en Configuración → Empresas.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
