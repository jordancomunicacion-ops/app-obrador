import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/lib/auth/location";
import { parseDateRange } from "@/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const range = parseDateRange(sp);

  const instances = await prisma.checklistInstance.findMany({
    where: {
      schedule: {
        ownerId: orgId,
        ...(locationId ? { locationId } : {}),
      },
      dueDate: { gte: range.from, lte: range.to },
    },
    select: {
      id: true,
      status: true,
      scoreAvg: true,
      schedule: {
        select: {
          template: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
        },
      },
    },
  });

  type Key = string; // templateId|locationId
  const groups = new Map<
    Key,
    {
      templateName: string;
      locationName: string;
      total: number;
      done: number;
      incidents: number;
      scoreSum: number;
      scoreCount: number;
    }
  >();

  for (const i of instances) {
    const key = `${i.schedule.template.id}|${i.schedule.location.id}`;
    const g =
      groups.get(key) ??
      {
        templateName: i.schedule.template.name,
        locationName: i.schedule.location.name,
        total: 0,
        done: 0,
        incidents: 0,
        scoreSum: 0,
        scoreCount: 0,
      };
    g.total++;
    if (i.status === "DONE" || i.status === "INCIDENT") g.done++;
    if (i.status === "INCIDENT") g.incidents++;
    if (i.scoreAvg !== null) {
      g.scoreSum += i.scoreAvg;
      g.scoreCount++;
    }
    groups.set(key, g);
  }

  const rows = Array.from(groups.values()).sort((a, b) =>
    a.locationName.localeCompare(b.locationName) || a.templateName.localeCompare(b.templateName),
  );

  const defaultFrom = range.from.toISOString().slice(0, 10);
  const defaultTo = range.to.toISOString().slice(0, 10);

  return (
    <div>
      <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />

      {rows.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12">
          No hay instancias en este rango.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Plantilla</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Realizados</th>
                <th className="px-4 py-3 text-center">% Cumplim.</th>
                <th className="px-4 py-3 text-center">Incidencias</th>
                <th className="px-4 py-3 text-center">Valoración media</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, idx) => {
                const pct = r.total === 0 ? 0 : (r.done / r.total) * 100;
                const avg = r.scoreCount === 0 ? null : r.scoreSum / r.scoreCount;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{r.locationName}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.templateName}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.total}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.done}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={clsx(
                          "font-semibold",
                          pct >= 90 ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-600",
                        )}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.incidents > 0 ? (
                        <span className="text-red-600 font-medium">{r.incidents}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {avg !== null ? `${avg.toFixed(1)}/10` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
