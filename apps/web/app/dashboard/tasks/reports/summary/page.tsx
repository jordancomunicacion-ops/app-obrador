import { currentOrgId } from "@/auth";
import { currentLocationId, currentLocation } from "@/app/lib/auth/location";
import {
  computeOperationsKPIs,
  computeProductionKPIs,
  parseDateRange,
} from "@/app/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";

// Frente B (Opción B): informe ÚNICO que resume las dos familias de trabajo
// —PRODUCCIÓN (Task) y OPERATIVA (ChecklistInstance)— en el mismo rango y local.
// Solo lectura; reaprovecha los KPIs existentes sin migrar datos.

function Card({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-xl border ${color}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
    </div>
  );
}

export default async function ReportsSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) {
    return <p className="text-sm text-gray-500">Selecciona una cuenta para ver el resumen.</p>;
  }
  const locationId = await currentLocationId();
  const loc = await currentLocation();
  const range = parseDateRange(sp);

  const [oper, prod] = await Promise.all([
    computeOperationsKPIs(orgId, range, locationId ?? undefined),
    computeProductionKPIs(orgId, range, locationId ?? undefined),
  ]);

  const defaultFrom = range.from.toISOString().slice(0, 10);
  const defaultTo = range.to.toISOString().slice(0, 10);

  return (
    <div>
      <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />

      {loc && (
        <p className="text-sm text-gray-500 mb-4">
          Local: <span className="font-medium text-gray-700">{loc.name}</span>
        </p>
      )}

      <section className="mb-8">
        <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-3">
          Producción
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card
            label="Tareas"
            value={String(prod.tareas)}
            color="bg-purple-50 text-purple-800 border-purple-200"
          />
          <Card
            label="Realizadas"
            value={`${prod.realizadas.toFixed(1)}%`}
            color="bg-emerald-50 text-emerald-800 border-emerald-200"
          />
          <Card
            label="En curso"
            value={`${prod.enCurso.toFixed(1)}%`}
            color="bg-amber-50 text-amber-800 border-amber-200"
          />
          <Card
            label="Incidencias"
            value={String(prod.incidencias)}
            color="bg-rose-50 text-rose-800 border-rose-200"
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-sky-700 uppercase tracking-wider mb-3">
          Operativa (checklists)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card
            label="Programados"
            value={String(oper.programados)}
            color="bg-sky-50 text-sky-800 border-sky-200"
          />
          <Card
            label="Realizados"
            value={`${oper.checklistsRealizados.toFixed(1)}%`}
            color="bg-emerald-50 text-emerald-800 border-emerald-200"
          />
          <Card
            label="Supervisados"
            value={`${oper.lineasSupervisadas.toFixed(1)}%`}
            color="bg-indigo-50 text-indigo-800 border-indigo-200"
          />
          <Card
            label="Valoración media"
            value={`${oper.valoracionMedia.toFixed(1)}%`}
            color="bg-violet-50 text-violet-800 border-violet-200"
          />
        </div>
      </section>
    </div>
  );
}
