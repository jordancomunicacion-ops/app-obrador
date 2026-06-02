import DashboardAlerts from "@/app/ui/dashboard/alerts";
import { prisma } from "@/app/lib/prisma";
import { startOfDay, endOfDay, addDays, format } from "date-fns";
import Link from "next/link";
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  BeakerIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { locationScope } from "@/app/lib/auth/scope";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { computeOperationsKPIs, computeProductionKPIs } from "@/app/lib/reports/kpi";
import PageHeader from "@/app/ui/primitives/page-header";
import Card from "@/app/ui/primitives/card";
import StatCard from "@/app/ui/primitives/stat-card";
import Badge from "@/app/ui/primitives/badge";

function fmtAgo(d: Date | null | undefined) {
  if (!d) return "Sin registros";
  return new Date(d).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const scope = await locationScope();
  const session = await auth();
  const ownerId = session?.user?.id ?? "__none__";
  const orgId = await currentOrgId();
  const locationId = await currentLocationId();

  const today = new Date();
  const todayStart = startOfDay(today);
  const sevenDaysLater = endOfDay(addDays(today, 7));
  const dayStartUTC = new Date();
  dayStartUTC.setUTCHours(0, 0, 0, 0);
  const dayEndUTC = new Date(dayStartUTC);
  dayEndUTC.setUTCDate(dayEndUTC.getUTCDate() + 1);
  const in3days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  const taskScope = orgId ? { ownerId: orgId, ...(locationId ? { locationId } : {}) } : null;

  const [
    upcomingEventsCount,
    tasksPendingCount,
    weeklyEvents,
    activeBatches,
    expiringBatches,
    tempIssuesToday,
    openIncidents,
    lastTemp,
    lastCleaning,
    todayTasks,
    todayInstances,
  ] = await Promise.all([
    prisma.event.count({ where: { ...scope, date: { gte: todayStart } } }),
    prisma.task.count({ where: { ...scope, status: { not: "DONE" } } }),
    prisma.event.findMany({
      where: { ...scope, date: { gte: todayStart, lte: sevenDaysLater } },
      orderBy: { date: "asc" },
      include: { _count: { select: { menuItems: true } } },
    }),
    prisma.obradorProductionBatch.count({ where: { ownerId, status: "abierto" } }),
    prisma.obradorProductionBatch.count({
      where: { ownerId, status: { not: "retirado" }, expiryDate: { gte: today, lte: in3days } },
    }),
    prisma.obradorTemperatureLog.count({
      where: { ownerId, hasIncidence: true, logDate: { gte: dayStartUTC } },
    }),
    prisma.obradorIncident.count({ where: { ownerId, status: "abierto" } }),
    prisma.obradorTemperatureLog.findFirst({ where: { ownerId }, orderBy: { logDate: "desc" } }),
    prisma.obradorCleaningLog.findFirst({ orderBy: { logDate: "desc" } }),
    taskScope
      ? prisma.task.findMany({
          where: { ...taskScope, plannedStart: { gte: dayStartUTC, lt: dayEndUTC } },
          select: { status: true },
          take: 500,
        })
      : Promise.resolve([]),
    taskScope
      ? prisma.checklistInstance.findMany({
          where: { dueDate: { gte: dayStartUTC, lt: dayEndUTC }, schedule: taskScope },
          select: { status: true },
          take: 500,
        })
      : Promise.resolve([]),
  ]);

  const eventsWithProgress = await Promise.all(
    weeklyEvents.map(async (event) => {
      const totalTasks = await prisma.task.count({
        where: { ...scope, events: { some: { id: event.id } } },
      });
      const doneTasks = await prisma.task.count({
        where: { ...scope, events: { some: { id: event.id } }, status: "DONE" },
      });
      return {
        ...event,
        progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      };
    }),
  );

  // Informe de tareas (últimos 30 días): reaprovecha los KPIs de los informes
  const reportRange = { from: startOfDay(addDays(today, -30)), to: endOfDay(today) };
  const [prodKpis, operKpis] = orgId
    ? await Promise.all([
        computeProductionKPIs(orgId, reportRange, locationId ?? undefined),
        computeOperationsKPIs(orgId, reportRange, locationId ?? undefined),
      ])
    : [null, null];

  // Resumen de trabajo de hoy (producción + operativa)
  const prodCount = todayTasks.length;
  const operCount = todayInstances.length;
  const doneToday =
    todayTasks.filter((t) => t.status === "DONE").length +
    todayInstances.filter((i) => i.status === "DONE" || i.status === "CLOSED_AUTO").length;
  const issuesToday =
    todayTasks.filter((t) => t.status === "ISSUE").length +
    todayInstances.filter((i) => i.status === "INCIDENT").length;

  const statusMeta = (s: string): { label: string; tone: "success" | "warning" | "neutral" } => {
    if (s === "CONFIRMED") return { label: "Confirmado", tone: "success" };
    if (s === "DRAFT") return { label: "Borrador", tone: "warning" };
    if (s === "COMPLETED") return { label: "Completado", tone: "neutral" };
    return { label: s, tone: "neutral" };
  };

  const pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <main className="space-y-10">
      <PageHeader icon={<HomeIcon className="w-6 h-6" />} title="Dashboard" />

      {/* Indicadores principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card href="/dashboard/events" className="p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <CalendarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Próximos eventos</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{upcomingEventsCount}</p>
        </Card>
        <Card href="/dashboard/tasks" className="p-5">
          <div className="flex items-center gap-2 text-gray-500">
            <ClipboardDocumentListIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Tareas pendientes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{tasksPendingCount}</p>
        </Card>
        <DashboardAlerts />
      </div>

      {/* Resumen: Tareas de hoy */}
      <Summary
        icon={<Squares2X2Icon className="w-5 h-5" />}
        title="Tareas de hoy"
        href="/dashboard/tasks/board"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Producción" value={prodCount} tone="accent" />
          <StatCard label="Operativa" value={operCount} tone="accent" />
          <StatCard label="Hechas" value={doneToday} tone="success" />
          <StatCard label="Incidencias" value={issuesToday} tone={issuesToday > 0 ? "danger" : "success"} />
        </div>
      </Summary>

      {/* Informe de tareas: KPIs de los últimos 30 días (producción + operativa) */}
      {prodKpis && operKpis && (
        <Summary
          icon={<ChartBarIcon className="w-5 h-5" />}
          title="Informe de tareas · últimos 30 días"
          href="/dashboard/tasks/reports/summary"
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Producción
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Tareas" value={prodKpis.tareas} tone="accent" />
                <StatCard label="Realizadas" value={pct(prodKpis.realizadas)} tone="success" />
                <StatCard label="En curso" value={pct(prodKpis.enCurso)} tone="warning" />
                <StatCard
                  label="Incidencias"
                  value={prodKpis.incidencias}
                  tone={prodKpis.incidencias > 0 ? "danger" : "success"}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Operativa (checklists)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Programados" value={operKpis.programados} tone="accent" />
                <StatCard label="Realizados" value={pct(operKpis.checklistsRealizados)} tone="success" />
                <StatCard label="Líneas realizadas" value={pct(operKpis.lineasRealizadas)} tone="success" />
                <StatCard label="Supervisados" value={pct(operKpis.lineasSupervisadas)} tone="accent" />
                <StatCard label="Superv. totalmente" value={pct(operKpis.supervisadosTotalmente)} tone="accent" />
                <StatCard label="Valoración media" value={pct(operKpis.valoracionMedia)} tone="accent" />
              </div>
            </div>
          </div>
        </Summary>
      )}

      {/* Resumen: Obrador */}
      <Summary
        icon={<BeakerIcon className="w-5 h-5" />}
        title="Obrador"
        href="/dashboard/obrador/production"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Lotes activos" value={activeBatches} tone="accent" />
          <StatCard label="Alertas caducidad" value={expiringBatches} tone={expiringBatches > 0 ? "danger" : "success"} />
          <StatCard label="Desv. temp. hoy" value={tempIssuesToday} tone={tempIssuesToday > 0 ? "warning" : "success"} />
          <StatCard label="Incidencias" value={openIncidents} tone={openIncidents > 0 ? "danger" : "success"} />
        </div>
      </Summary>

      {/* Resumen: Controles sanitarios */}
      <Summary
        icon={<ShieldCheckIcon className="w-5 h-5" />}
        title="Controles sanitarios"
        href="/dashboard/obrador/compliance/temperatures"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MiniInfo label="Último registro de temperatura" value={fmtAgo(lastTemp?.logDate)} />
          <MiniInfo
            label="Incidencias abiertas"
            value={openIncidents > 0 ? `${openIncidents} abierta(s)` : "Sin incidencias"}
            danger={openIncidents > 0}
          />
          <MiniInfo label="Última limpieza" value={fmtAgo(lastCleaning?.logDate)} />
        </div>
      </Summary>

      {/* Resumen de la semana */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Resumen de la semana</h2>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
          {eventsWithProgress.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Evento</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Progreso</th>
                  <th className="px-4 py-3">Pax</th>
                  <th className="px-4 py-3">Platos</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eventsWithProgress.map((event) => {
                  const meta = statusMeta(event.status);
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="hover:text-[var(--accent-soft-contrast)]"
                        >
                          {event.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {format(new Date(event.date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent)] transition-all duration-500"
                              style={{ width: `${event.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{event.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{event.pax}</td>
                      <td className="px-4 py-3 text-gray-500">{event._count.menuItems}</td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 italic text-center py-10">
              No hay eventos programados para los próximos 7 días.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function Summary({
  icon,
  title,
  href,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <Link href={href} className="text-sm text-[var(--accent-soft-contrast)] hover:underline">
          Ver detalle →
        </Link>
      </div>
      {children}
    </section>
  );
}

function MiniInfo({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-1 ${danger ? "text-red-600" : "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}
