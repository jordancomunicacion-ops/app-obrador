import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import {
  startOfWeekUTC,
  addDaysUTC,
  isoDate,
  weekDays,
  WEEKDAY_LABELS_LONG,
} from "@/lib/week";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default async function MyScheduleMobilePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) return null;

  const userId = session.user.id;
  const base = sp.week ? new Date(`${sp.week}T00:00:00.000Z`) : new Date();
  const monday = startOfWeekUTC(base);
  const days = weekDays(monday);

  const shifts = await prisma.shift.findMany({
    where: {
      ownerId: orgId,
      workerId: userId,
      date: { gte: monday, lte: addDaysUTC(monday, 6) },
    },
    include: { location: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  const byDay = new Map(shifts.map((s) => [isoDate(new Date(s.date)), s]));

  function durationHours(start: string, end: string, breakMin: number): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm - breakMin) / 60);
  }
  const totalH = shifts.reduce(
    (sum, s) => sum + durationHours(s.startTime, s.endTime, s.breakMinutes),
    0,
  );

  const prevMonday = addDaysUTC(monday, -7);
  const nextMonday = addDaysUTC(monday, 7);
  const todayISO = isoDate(new Date());

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/today"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="text-xl font-semibold text-gray-800 mb-4">Mi horario</h1>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 mb-4">
        <Link
          href={`/dashboard/today/schedule?week=${isoDate(prevMonday)}`}
          className="p-1.5 rounded hover:bg-gray-100"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <span className="text-sm font-medium text-gray-800">
          Semana del {monday.getUTCDate()}{" "}
          {monday.toLocaleDateString("es-ES", { month: "short" })}
        </span>
        <Link
          href={`/dashboard/today/schedule?week=${isoDate(nextMonday)}`}
          className="p-1.5 rounded hover:bg-gray-100"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </Link>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600 flex items-center gap-2">
          <ClockIcon className="w-4 h-4" />
          Total horas semana
        </span>
        <span className="text-lg font-bold font-mono tabular-nums">{totalH.toFixed(1)}h</span>
      </div>

      <div className="space-y-2">
        {days.map((d, i) => {
          const k = isoDate(d);
          const shift = byDay.get(k);
          const isToday = k === todayISO;
          return (
            <div
              key={k}
              className={clsx(
                "border rounded-xl p-3",
                isToday ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-gray-800">
                  {WEEKDAY_LABELS_LONG[i]}{" "}
                  <span className="text-gray-400 font-normal">{d.getUTCDate()}</span>
                </p>
                {isToday && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                    Hoy
                  </span>
                )}
              </div>
              {shift ? (
                <>
                  <p className="text-lg font-mono font-semibold tabular-nums text-gray-800">
                    {shift.startTime} – {shift.endTime}
                  </p>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {durationHours(shift.startTime, shift.endTime, shift.breakMinutes).toFixed(
                      1,
                    )}
                    h efectivas
                    {shift.breakMinutes > 0 && ` · ${shift.breakMinutes}m pausa`}
                    {shift.location && ` · ${shift.location.name}`}
                  </div>
                  {shift.note && (
                    <p className="text-xs text-gray-600 mt-1 italic">{shift.note}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">Libre</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
