import Link from "next/link";
import clsx from "clsx";
import TaskBoard from "@/app/ui/tasks/board";
import { CreateTask, GenerateWeeklyProduction } from "@/app/ui/tasks/buttons";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";

const RANGES = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Semana" },
  { key: "all", label: "Todas" },
];

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = sp.range === "week" || sp.range === "all" ? sp.range : "today";

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/dashboard/tasks/board${r.key === "today" ? "" : `?range=${r.key}`}`}
              className={clsx(
                "text-xs font-medium px-3 py-1.5 rounded-full border",
                range === r.key
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/tasks/routines"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 px-3 py-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Ciclos de producción
          </Link>
          <CreateTask />
          <GenerateWeeklyProduction />
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <Suspense fallback={<div>Cargando tareas...</div>}>
          <TaskBoard range={range} />
        </Suspense>
      </div>
    </div>
  );
}
