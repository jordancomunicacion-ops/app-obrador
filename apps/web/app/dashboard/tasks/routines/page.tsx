import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowPathIcon, PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import DeleteRoutineButton from "@/app/ui/tasks/delete-routine-button";

const FREQ_LABEL: Record<string, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

export default async function ProductionRoutinesPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const routines = await prisma.productionRoutine.findMany({
    where: { ownerId: orgId },
    include: {
      recipe: { select: { name: true } },
      location: { select: { name: true } },
      defaultAssignee: { select: { name: true } },
    },
    orderBy: [{ isActive: "desc" }, { title: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <ArrowPathIcon className="w-6 h-6" />
          Ciclos de producción
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tasks/board" className="text-sm text-indigo-600 hover:underline">
            Tablero
          </Link>
          <Link
            href="/dashboard/tasks/routines/new"
            className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo ciclo
          </Link>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Tareas de producción/cocina/limpieza que se generan automáticamente según su frecuencia y
        aparecen en el tablero y en “Hoy”.
      </p>

      {routines.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
          Aún no hay ciclos. Crea el primero con “Nuevo ciclo”.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Frecuencia</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Asignado por defecto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routines.map((r) => (
                <tr key={r.id} className={clsx("hover:bg-gray-50", !r.isActive && "opacity-50")}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {r.title}
                    {(r.recipe?.name || r.action) && (
                      <span className="block text-xs text-gray-400">
                        {[r.recipe?.name, r.action].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{FREQ_LABEL[r.frequency] ?? r.frequency}</td>
                  <td className="px-4 py-3 text-gray-600">{r.executionTime ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.location?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.defaultAssignee?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full",
                        r.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {r.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/tasks/routines/${r.id}`}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Editar"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </Link>
                      <DeleteRoutineButton id={r.id} title={r.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
