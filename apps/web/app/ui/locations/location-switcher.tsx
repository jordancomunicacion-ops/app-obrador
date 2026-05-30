"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BuildingStorefrontIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { setActiveLocation } from "@/app/lib/actions/locations";

type Loc = { id: string; name: string; shortCode: string | null };

export default function LocationSwitcher({
  locations,
  activeId,
}: {
  locations: Loc[];
  activeId: string | null;
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

  if (locations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 px-3 py-2">
        <BuildingStorefrontIcon className="w-4 h-4" />
        Sin locales
      </div>
    );
  }

  const active = locations.find((l) => l.id === activeId) ?? locations[0];

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
        <BuildingStorefrontIcon className="w-4 h-4 text-indigo-600" />
        <span className="truncate max-w-[180px]">{active.name}</span>
        <ChevronDownIcon className="w-3 h-3 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            Local activo
          </div>
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() =>
                startTransition(async () => {
                  await setActiveLocation(loc.id);
                  setOpen(false);
                  router.refresh();
                })
              }
              className={clsx(
                "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors",
                loc.id === active.id && "bg-indigo-50",
              )}
            >
              <span className="flex flex-col">
                <span className="font-medium text-gray-800">{loc.name}</span>
                {loc.shortCode && (
                  <span className="text-xs text-gray-400">{loc.shortCode}</span>
                )}
              </span>
              {loc.id === active.id && (
                <CheckIcon className="w-4 h-4 text-indigo-600 flex-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
