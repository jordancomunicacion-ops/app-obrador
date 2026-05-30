import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/lib/auth/location";
import { parseDateRange } from "@/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";
import {
  ArrowDownTrayIcon,
  PhotoIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

function formatHours(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export default async function ClockInAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; worker?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const range = parseDateRange(sp);

  const entries = await prisma.clockIn.findMany({
    where: {
      ownerId: orgId,
      startAt: { gte: range.from, lte: range.to },
      ...(sp.worker ? { workerId: sp.worker } : {}),
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
    },
    include: {
      worker: { select: { id: true, name: true } },
      location: { select: { name: true } },
    },
    orderBy: { startAt: "desc" },
    take: 500,
  });

  // Agregado por trabajador
  type Agg = {
    workerId: string;
    workerName: string;
    totalMs: number;
    sessions: number;
    openSession: boolean;
  };
  const byWorker = new Map<string, Agg>();
  for (const e of entries) {
    const g =
      byWorker.get(e.workerId) ??
      {
        workerId: e.workerId,
        workerName: e.worker.name,
        totalMs: 0,
        sessions: 0,
        openSession: false,
      };
    g.sessions++;
    if (e.endAt) g.totalMs += e.endAt.getTime() - e.startAt.getTime();
    else g.openSession = true;
    byWorker.set(e.workerId, g);
  }
  const aggregates = Array.from(byWorker.values()).sort((a, b) => b.totalMs - a.totalMs);

  const defaultFrom = range.from.toISOString().slice(0, 10);
  const defaultTo = range.to.toISOString().slice(0, 10);
  const exportUrl = `/api/clock-in/export?from=${defaultFrom}&to=${defaultTo}${
    sp.worker ? `&worker=${sp.worker}` : ""
  }`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800">Fichajes</h1>
        <a
          href={exportUrl}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Exportar CSV
        </a>
      </div>

      <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />

      {/* Resumen por trabajador */}
      {aggregates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Resumen por trabajador
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Trabajador</th>
                <th className="px-4 py-2 text-center">Sesiones</th>
                <th className="px-4 py-2 text-right">Horas totales</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {aggregates.map((a) => (
                <tr key={a.workerId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{a.workerName}</td>
                  <td className="px-4 py-2 text-center text-gray-700">{a.sessions}</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">
                    {formatHours(a.totalMs)}
                    {a.openSession && (
                      <span className="ml-2 text-xs text-amber-600">+ en curso</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/dashboard/clock-in?from=${defaultFrom}&to=${defaultTo}&worker=${a.workerId}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Filtrar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Listado detallado */}
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Detalle ({entries.length} {entries.length === 1 ? "fichaje" : "fichajes"})
      </h2>
      {entries.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
          No hay fichajes en este rango.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Trabajador</th>
                <th className="px-3 py-2">Local</th>
                <th className="px-3 py-2">Entrada</th>
                <th className="px-3 py-2">Salida</th>
                <th className="px-3 py-2 text-right">Duración</th>
                <th className="px-3 py-2 text-center">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => {
                const dur = e.endAt ? e.endAt.getTime() - e.startAt.getTime() : null;
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {new Date(e.startAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800">{e.worker.name}</td>
                    <td className="px-3 py-2 text-gray-600">{e.location?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-700 font-mono tabular-nums">
                      {new Date(e.startAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 text-gray-700 font-mono tabular-nums">
                      {e.endAt
                        ? new Date(e.endAt).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {dur === null ? (
                        <span className="text-xs text-amber-600">en curso</span>
                      ) : (
                        <span className="font-mono tabular-nums">{formatHours(dur)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {e.startPhotoUrl || e.endPhotoUrl ? (
                        <div className="inline-flex gap-1">
                          {e.startPhotoUrl && (
                            <a href={e.startPhotoUrl} target="_blank" rel="noreferrer">
                              <PhotoIcon className="w-4 h-4 text-gray-400 hover:text-indigo-600" />
                            </a>
                          )}
                          {e.endPhotoUrl && (
                            <a href={e.endPhotoUrl} target="_blank" rel="noreferrer">
                              <PhotoIcon className="w-4 h-4 text-gray-400 hover:text-indigo-600" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
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
