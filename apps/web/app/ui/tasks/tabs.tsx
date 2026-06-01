"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/dashboard/tasks/all", label: "Todo" },
  { href: "/dashboard/tasks/board", label: "Tablero" },
  { href: "/dashboard/tasks/templates", label: "Plantillas" },
  { href: "/dashboard/tasks/schedules", label: "Programaciones" },
  { href: "/dashboard/tasks/supervise", label: "Supervisar" },
  { href: "/dashboard/tasks/calendar", label: "Calendario" },
  { href: "/dashboard/tasks/reports", label: "Informes" },
];

export default function TasksTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-6">
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
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
