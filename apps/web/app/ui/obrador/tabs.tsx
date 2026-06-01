"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/dashboard/obrador", label: "Resumen", exact: true },
  { href: "/dashboard/obrador/intake", label: "Entradas MP" },
  { href: "/dashboard/obrador/production", label: "Producción y Lotes" },
  { href: "/dashboard/today/labels?destination=sale", label: "Etiquetado" },
];

export default function ObradorTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
      {TABS.map((t) => {
        const base = t.href.split("?")[0];
        const active = t.exact ? pathname === base : pathname?.startsWith(base);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              active
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
