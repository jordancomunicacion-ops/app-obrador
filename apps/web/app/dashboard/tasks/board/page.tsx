import Link from "next/link";
import TaskBoard from "@/app/ui/tasks/board";
import { CreateTask, GenerateWeeklyProduction } from "@/app/ui/tasks/buttons";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";

export default function BoardPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-end gap-2 mb-4">
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
      <div className="flex-grow overflow-auto">
        <Suspense fallback={<div>Cargando tareas...</div>}>
          <TaskBoard />
        </Suspense>
      </div>
    </div>
  );
}
