"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

const TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "BREAKDOWN", label: "Averías" },
  { key: "NOTICE", label: "Avisos" },
  { key: "EVENT", label: "Eventos" },
  { key: "MEETING", label: "Reuniones" },
  { key: "TASK", label: "Programadas" },
  { key: "LIST", label: "Listas" },
];

export default function CommunicationTypeTabs() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get("type") ?? "ALL";

  return (
    <nav className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
      {TABS.map((t) => {
        const active = current === t.key;
        const href = t.key === "ALL" ? pathname : `${pathname}?type=${t.key}`;
        return (
          <Link
            key={t.key}
            href={href}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
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
