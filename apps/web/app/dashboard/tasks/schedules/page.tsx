import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { PlusIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

const FREQ_LABEL: Record<string, string> = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

export default async function SchedulesPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const schedules = await prisma.checklistSchedule.findMany({
    where: { businessId: orgId },
    include: {
      template: { select: { name: true } },
      location: { select: { name: true } },
      _count: { select: { instances: true } },
    },
    orderBy: [{ pinned: "desc" }, { startDate: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {schedules.length} {schedules.length === 1 ? "programación" : "programaciones"}
        </p>
        <Link
          href="/dashboard/tasks/schedules/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva programación
        </Link>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-lg">
          <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">
            Aún no hay programaciones. Crea una para asignar una plantilla a un local con
            recurrencia.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Plantilla</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Frecuencia</th>
                <th className="px-4 py-3">Franja horaria</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3 text-center">Instancias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/tasks/schedules/${s.id}`}
                      className="font-medium text-gray-800 hover:text-indigo-600"
                    >
                      {s.template.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.location.name}</td>
                  <td className="px-4 py-3 text-gray-600">{FREQ_LABEL[s.frequency]}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.executionStartTime}–{s.executionEndTime}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(s.startDate).toLocaleDateString("es-ES")}
                    {s.endDate && ` → ${new Date(s.endDate).toLocaleDateString("es-ES")}`}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{s._count.instances}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
