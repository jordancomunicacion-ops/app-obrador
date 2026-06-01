"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/dashboard/tasks/reports/summary", label: "Resumen" },
  { href: "/dashboard/tasks/reports/operations", label: "Operaciones" },
  { href: "/dashboard/tasks/reports/compliance", label: "Cumplimiento" },
  { href: "/dashboard/tasks/reports/incidents", label: "Incidencias" },
  { href: "/dashboard/tasks/reports/responses", label: "Respuestas" },
];

export default function ReportTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-4">
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              active
                ? "border-indigo-600 text-indigo-700"
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
