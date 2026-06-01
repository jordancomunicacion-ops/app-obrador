"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BuildingOffice2Icon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { setActiveAccount } from "@/app/lib/actions/accounts";

type Account = { id: string; name: string | null; email: string | null; empresa: string | null };

const ALL_LABEL = "Todas las cuentas";

export default function AccountSwitcher({
  accounts,
  activeId,
}: {
  accounts: Account[];
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

  const active = accounts.find((a) => a.id === activeId) ?? null;
  const activeLabel = active ? active.empresa ?? active.name ?? active.email ?? "Cuenta" : ALL_LABEL;

  function select(id: string | null) {
    startTransition(async () => {
      await setActiveAccount(id);
      setOpen(false);
      router.refresh();
    });
  }

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
            Cuenta activa
          </div>

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

          {accounts.map((acc) => {
            const isActive = acc.id === active?.id;
            const primary = acc.empresa ?? acc.name ?? acc.email ?? "Cuenta";
            const secondary = acc.empresa ? acc.name ?? acc.email : acc.email;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => select(acc.id)}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors",
                  isActive && "bg-emerald-50",
                )}
              >
                <span className="flex flex-col min-w-0">
                  <span className="font-medium text-gray-800 truncate">{primary}</span>
                  {secondary && <span className="text-xs text-gray-400 truncate">{secondary}</span>}
                </span>
                {isActive && <CheckIcon className="w-4 h-4 text-emerald-600 flex-none" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
