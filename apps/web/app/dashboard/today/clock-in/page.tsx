import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { ArrowLeftIcon, ClockIcon, PhotoIcon } from "@heroicons/react/24/outline";

function formatHours(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function startOfMonthUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export default async function PersonalClockInHistoryPage() {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) return null;

  const fromMonth = startOfMonthUTC();

  const entries = await prisma.clockIn.findMany({
    where: {
      ownerId: orgId,
      workerId: session.user.id,
      startAt: { gte: fromMonth },
    },
    include: { location: { select: { name: true } } },
    orderBy: { startAt: "desc" },
  });

  // Total horas mes
  const totalMs = entries.reduce((sum, e) => {
    if (!e.endAt) return sum;
    return sum + (e.endAt.getTime() - e.startAt.getTime());
  }, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/today"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="text-xl font-semibold text-gray-800 mb-1">Mi historial de fichajes</h1>
      <p className="text-sm text-gray-500 mb-4">
        {fromMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
      </p>

      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">Horas trabajadas este mes</span>
        </div>
        <p className="text-2xl font-bold text-gray-800 font-mono tabular-nums">
          {formatHours(totalMs)}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12">No tienes fichajes este mes.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => {
            const duration = e.endAt ? e.endAt.getTime() - e.startAt.getTime() : null;
            return (
              <div key={e.id} className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(e.startAt).toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  {duration === null ? (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      En curso
                    </span>
                  ) : (
                    <span className="text-sm font-mono tabular-nums text-gray-700">
                      {formatHours(duration)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(e.startAt).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" → "}
                  {e.endAt
                    ? new Date(e.endAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                  {e.location && ` · ${e.location.name}`}
                </p>
                {(e.startPhotoUrl || e.endPhotoUrl) && (
                  <div className="flex gap-2 mt-2">
                    {e.startPhotoUrl && (
                      <a href={e.startPhotoUrl} target="_blank" rel="noreferrer">
                        <img
                          src={e.startPhotoUrl}
                          alt="Entrada"
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                          title="Foto entrada"
                        />
                      </a>
                    )}
                    {e.endPhotoUrl && (
                      <a href={e.endPhotoUrl} target="_blank" rel="noreferrer">
                        <img
                          src={e.endPhotoUrl}
                          alt="Salida"
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                          title="Foto salida"
                        />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
