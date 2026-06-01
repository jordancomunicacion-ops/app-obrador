"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Navegación por pestañas de la sección "Controles sanitarios" (compliance),
// mismo patrón/color (emerald) que las pestañas de Obrador.
const TABS = [
  { href: "/dashboard/obrador/compliance/temperatures", label: "Temperaturas" },
  { href: "/dashboard/obrador/compliance/incidents", label: "Incidencias" },
  { href: "/dashboard/obrador/compliance/cleaning", label: "Limpieza" },
];

export default function ComplianceTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);
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
