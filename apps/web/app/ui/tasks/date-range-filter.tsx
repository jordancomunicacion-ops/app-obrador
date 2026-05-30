"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function DateRangeFilter({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom: string;
  defaultTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const from = sp.get("from") ?? defaultFrom;
  const to = sp.get("to") ?? defaultTo;

  function update(field: "from" | "to", value: string) {
    const next = new URLSearchParams(sp);
    next.set(field, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 mb-4 bg-white border border-gray-200 rounded-lg p-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Desde</span>
        <input
          type="date"
          value={from}
          onChange={(e) => update("from", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Hasta</span>
        <input
          type="date"
          value={to}
          onChange={(e) => update("to", e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </label>
    </div>
  );
}
