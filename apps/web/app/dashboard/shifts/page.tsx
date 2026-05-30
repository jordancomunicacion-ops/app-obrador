import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/lib/auth/location";
import {
  startOfWeekUTC,
  addDaysUTC,
  isoDate,
  weekDays,
  WEEKDAY_LABELS,
} from "@/lib/week";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import ShiftCell from "@/app/ui/shifts/shift-cell";
import CopyWeekButton from "@/app/ui/shifts/copy-week-button";

export default async function ShiftsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const locationId = await currentLocationId();
  const baseDate = sp.week ? new Date(`${sp.week}T00:00:00.000Z`) : new Date();
  const monday = startOfWeekUTC(baseDate);
  const sunday = addDaysUTC(monday, 6);
  const days = weekDays(monday);

  const [workers, shifts] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [{ id: orgId }, { adminId: orgId }],
        approved: true,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.shift.findMany({
      where: {
        ownerId: orgId,
        date: { gte: monday, lte: addDaysUTC(monday, 6) },
        ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      },
      include: { location: { select: { name: true } } },
    }),
  ]);

  // index: workerId -> dateISO -> shift
  const byWorkerDay = new Map<string, Map<string, typeof shifts[number]>>();
  for (const s of shifts) {
    const k = isoDate(new Date(s.date));
    if (!byWorkerDay.has(s.workerId)) byWorkerDay.set(s.workerId, new Map());
    byWorkerDay.get(s.workerId)!.set(k, s);
  }

  // Totales semanales por trabajador
  function durationHours(start: string, end: string, breakMin: number): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm - breakMin) / 60);
  }
  const totalsByWorker = new Map<string, number>();
  for (const s of shifts) {
    const h = durationHours(s.startTime, s.endTime, s.breakMinutes);
    totalsByWorker.set(s.workerId, (totalsByWorker.get(s.workerId) ?? 0) + h);
  }

  const prevMonday = addDaysUTC(monday, -7);
  const nextMonday = addDaysUTC(monday, 7);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDaysIcon className="w-6 h-6" />
          Turnos
        </h1>
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/shifts?week=${isoDate(prevMonday)}`}
            className="p-1.5 rounded hover:bg-gray-100"
            aria-label="Semana anterior"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <span className="text-sm font-medium text-gray-800">
            Semana del {monday.getUTCDate()}{" "}
            {monday.toLocaleDateString("es-ES", { month: "short" })} —{" "}
            {sunday.getUTCDate()}{" "}
            {sunday.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
          </span>
          <Link
            href={`/dashboard/shifts?week=${isoDate(nextMonday)}`}
            className="p-1.5 rounded hover:bg-gray-100"
            aria-label="Semana siguiente"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/shifts?week=${isoDate(startOfWeekUTC())}`}
            className="text-xs text-indigo-600 hover:underline"
          >
            Esta semana
          </Link>
          <CopyWeekButton
            fromMondayISO={isoDate(prevMonday)}
            toMondayISO={isoDate(monday)}
          />
        </div>
      </div>

      {workers.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12">
          No tienes trabajadores. Añádelos en Gestión de Usuarios.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                  Trabajador
                </th>
                {days.map((d, i) => {
                  const isToday = isoDate(d) === isoDate(new Date());
                  return (
                    <th
                      key={i}
                      className={
                        isToday
                          ? "px-2 py-2 text-center text-xs font-semibold uppercase bg-indigo-50 text-indigo-700 border-l border-gray-100"
                          : "px-2 py-2 text-center text-xs font-semibold uppercase text-gray-500 border-l border-gray-100"
                      }
                    >
                      <div>{WEEKDAY_LABELS[i]}</div>
                      <div className="text-base text-gray-700">{d.getUTCDate()}</div>
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase border-l border-gray-100">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-800 sticky left-0 bg-white z-10">
                    {w.name}
                  </td>
                  {days.map((d) => {
                    const k = isoDate(d);
                    const shift = byWorkerDay.get(w.id)?.get(k);
                    return (
                      <td key={k} className="p-1 border-l border-gray-100 align-top w-28">
                        <ShiftCell
                          workerId={w.id}
                          dateISO={k}
                          shift={
                            shift
                              ? {
                                  id: shift.id,
                                  startTime: shift.startTime,
                                  endTime: shift.endTime,
                                  breakMinutes: shift.breakMinutes,
                                  note: shift.note,
                                  locationName: shift.location?.name ?? null,
                                }
                              : null
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center text-sm font-mono tabular-nums text-gray-700 border-l border-gray-100">
                    {(totalsByWorker.get(w.id) ?? 0).toFixed(1)}h
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
