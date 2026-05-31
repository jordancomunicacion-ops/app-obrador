import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { parseDateRange } from "@/app/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

function renderValue(r: any): string {
  switch (r.field.type) {
    case "CHECK":
      return r.valueBool ? "✓ Hecho" : "—";
    case "YES_NO":
      return r.valueBool === true ? "Sí" : r.valueBool === false ? "No" : "—";
    case "TEXT":
      return r.valueText ?? "—";
    case "RATING_1_10":
      return r.valueRating !== null ? `${r.valueRating}/10` : "—";
    default:
      return "—";
  }
}

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const range = parseDateRange(sp);

  const responses = await prisma.checklistResponse.findMany({
    where: {
      instance: {
        schedule: {
          ownerId: orgId,
          ...(locationId ? { locationId } : {}),
        },
        dueDate: { gte: range.from, lte: range.to },
      },
    },
    include: {
      field: { select: { name: true, type: true } },
      answeredBy: { select: { name: true } },
      instance: {
        select: {
          id: true,
          dueDate: true,
          schedule: {
            select: {
              template: { select: { name: true } },
              location: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { answeredAt: "desc" },
    take: 200,
  });

  const defaultFrom = range.from.toISOString().slice(0, 10);
  const defaultTo = range.to.toISOString().slice(0, 10);
  const exportUrl = `/api/checklists/responses/export?from=${defaultFrom}&to=${defaultTo}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />
        <a
          href={exportUrl}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors h-fit"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Exportar CSV
        </a>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Mostrando hasta 200 respuestas más recientes. Exporta CSV para el total del rango.
      </p>

      {responses.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12">
          No hay respuestas en este rango.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Local</th>
                <th className="px-3 py-2">Plantilla</th>
                <th className="px-3 py-2">Campo</th>
                <th className="px-3 py-2">Respuesta</th>
                <th className="px-3 py-2">Por</th>
                <th className="px-3 py-2">Inc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {responses.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {new Date(r.instance.dueDate).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {r.instance.schedule.location.name}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {r.instance.schedule.template.name}
                  </td>
                  <td className="px-3 py-2 text-gray-800">{r.field.name}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-xs truncate">
                    {renderValue(r)}
                    {r.photoUrl && (
                      <a
                        href={r.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-indigo-600 hover:underline text-xs"
                      >
                        📷
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {r.answeredBy?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.isIncident ? (
                      <span className="text-red-600 text-xs font-medium">⚠</span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
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
