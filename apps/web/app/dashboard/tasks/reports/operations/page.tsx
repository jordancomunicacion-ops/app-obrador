import { currentOrgId } from "@/auth";
import { currentLocationId, currentLocation } from "@/lib/auth/location";
import { computeOperationsKPIs, parseDateRange } from "@/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const loc = await currentLocation();
  const range = parseDateRange(sp);

  const kpis = await computeOperationsKPIs(orgId, range, locationId ?? undefined);

  const cards: { label: string; value: string; sub?: string; color: string }[] = [
    {
      label: "Programados",
      value: String(kpis.programados),
      color: "bg-indigo-50 text-indigo-800 border-indigo-200",
    },
    {
      label: "Líneas Supervisadas",
      value: `${kpis.lineasSupervisadas.toFixed(1)}%`,
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      label: "Checklists Realizados",
      value: `${kpis.checklistsRealizados.toFixed(1)}%`,
      color: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      label: "Supervisados Totalmente",
      value: `${kpis.supervisadosTotalmente.toFixed(1)}%`,
      color: "bg-sky-50 text-sky-800 border-sky-200",
    },
    {
      label: "Valoración Media",
      value: `${kpis.valoracionMedia.toFixed(1)}%`,
      color: "bg-violet-50 text-violet-800 border-violet-200",
    },
    {
      label: "Líneas Realizadas",
      value: `${kpis.lineasRealizadas.toFixed(1)}%`,
      color: "bg-rose-50 text-rose-800 border-rose-200",
    },
  ];

  const defaultFrom = range.from.toISOString().slice(0, 10);
  const defaultTo = range.to.toISOString().slice(0, 10);

  return (
    <div>
      <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />

      {loc && (
        <p className="text-xs text-gray-500 mb-3">
          Filtrado por local <span className="font-medium">{loc.name}</span>.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`border-2 rounded-xl p-4 ${c.color}`}>
            <p className="text-xs uppercase tracking-wider opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
            {c.sub && <p className="text-xs mt-1 opacity-70">{c.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
