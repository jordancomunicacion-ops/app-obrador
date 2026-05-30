import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/lib/auth/location";
import { parseDateRange } from "@/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";
import { ExclamationTriangleIcon, PhotoIcon } from "@heroicons/react/24/outline";

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const range = parseDateRange(sp);

  const incidents = await prisma.checklistResponse.findMany({
    where: {
      isIncident: true,
      instance: {
        schedule: {
          ownerId: orgId,
          ...(locationId ? { locationId } : {}),
        },
        dueDate: { gte: range.from, lte: range.to },
      },
    },
    include: {
      field: { select: { name: true } },
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

  return (
    <div>
      <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />

      {incidents.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12">
          🎉 No hay incidencias en este rango.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {incidents.length} {incidents.length === 1 ? "incidencia" : "incidencias"}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {incidents.map((r) => (
              <div
                key={r.id}
                className="bg-white border-2 border-red-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {r.photoUrl ? (
                  <a href={r.photoUrl} target="_blank" rel="noreferrer">
                    <img
                      src={r.photoUrl}
                      alt="Incidencia"
                      className="w-full h-48 object-cover"
                    />
                  </a>
                ) : (
                  <div className="w-full h-48 bg-red-50 flex items-center justify-center">
                    <PhotoIcon className="w-12 h-12 text-red-200" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-none" />
                    <p className="font-semibold text-gray-800 truncate">{r.field.name}</p>
                  </div>
                  <p className="text-sm text-red-700 italic mb-2">
                    {r.incidentNote || "Sin nota"}
                  </p>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>
                      {r.instance.schedule.template.name} ·{" "}
                      {r.instance.schedule.location.name}
                    </p>
                    <p>
                      {new Date(r.instance.dueDate).toLocaleDateString("es-ES")}
                      {r.answeredBy && ` · ${r.answeredBy.name}`}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/tasks/supervise/${r.instance.id}`}
                    className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
                  >
                    Ver checklist
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
