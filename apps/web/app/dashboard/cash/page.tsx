import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { parseDateRange } from "@/app/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  PhotoIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const SHIFT_LABEL: Record<string, string> = {
  MORNING: "Comida",
  EVENING: "Cena",
  FULL_DAY: "Día",
};

function eur(n: number): string {
  return n.toFixed(2);
}

export default async function CashAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const range = parseDateRange(sp);

  const closings = await prisma.cashClosing.findMany({
    where: {
      ownerId: orgId,
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      date: { gte: range.from, lte: range.to },
    },
    include: {
      closedBy: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: [{ date: "desc" }, { shift: "asc" }],
    take: 500,
  });

  const totalCash = closings.reduce((s, c) => s + c.cashAmount, 0);
  const totalCard = closings.reduce((s, c) => s + c.cardAmount, 0);
  const totalOther = closings.reduce((s, c) => s + c.otherAmount, 0);
  const totalTips = closings.reduce((s, c) => s + c.tips, 0);
  const totalDiff = closings.reduce((s, c) => s + c.diff, 0);
  const totalIngresos = totalCash + totalCard + totalOther;

  const defaultFrom = range.from.toISOString().slice(0, 10);
  const defaultTo = range.to.toISOString().slice(0, 10);
  const exportUrl = `/api/cash-closings/export?from=${defaultFrom}&to=${defaultTo}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <BanknotesIcon className="w-6 h-6" />
          Cierres de caja
        </h1>
        <div className="flex gap-2">
          <a
            href={exportUrl}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Exportar CSV
          </a>
          <Link
            href="/dashboard/today/cash"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Nuevo cierre
          </Link>
        </div>
      </div>

      <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <KPI label="Efectivo" value={`${eur(totalCash)} €`} color="emerald" />
        <KPI label="Tarjeta" value={`${eur(totalCard)} €`} color="sky" />
        <KPI label="Otros" value={`${eur(totalOther)} €`} color="violet" />
        <KPI label="Propinas" value={`${eur(totalTips)} €`} color="amber" />
        <KPI
          label="Total ingresos"
          value={`${eur(totalIngresos)} €`}
          color="indigo"
          big
        />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">Diferencias acumuladas</span>
        <span
          className={clsx(
            "text-lg font-bold font-mono tabular-nums",
            Math.abs(totalDiff) < 0.01
              ? "text-gray-700"
              : totalDiff > 0
                ? "text-green-700"
                : "text-red-700",
          )}
        >
          {totalDiff > 0 ? "+" : ""}
          {eur(totalDiff)} €
        </span>
      </div>

      {closings.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
          No hay cierres en este rango.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Turno</th>
                <th className="px-3 py-2">Local</th>
                <th className="px-3 py-2 text-right">Efectivo</th>
                <th className="px-3 py-2 text-right">Tarjeta</th>
                <th className="px-3 py-2 text-right">Otros</th>
                <th className="px-3 py-2 text-right">Propinas</th>
                <th className="px-3 py-2 text-right">Dif.</th>
                <th className="px-3 py-2 text-center">Foto</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {closings.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {new Date(c.date).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">{SHIFT_LABEL[c.shift]}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {c.location?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {eur(c.cashAmount)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {eur(c.cardAmount)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {eur(c.otherAmount)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-amber-700">
                    {eur(c.tips)}
                  </td>
                  <td
                    className={clsx(
                      "px-3 py-2 text-right font-mono tabular-nums font-semibold",
                      Math.abs(c.diff) < 0.01
                        ? "text-gray-500"
                        : c.diff > 0
                          ? "text-green-700"
                          : "text-red-700",
                    )}
                  >
                    {c.diff > 0 ? "+" : ""}
                    {eur(c.diff)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {c.photoUrl ? (
                      <a href={c.photoUrl} target="_blank" rel="noreferrer">
                        <PhotoIcon className="w-4 h-4 inline text-gray-400 hover:text-indigo-600" />
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {c.isLocked && (
                      <LockClosedIcon
                        className="w-4 h-4 inline text-gray-400"
                        title="Bloqueado"
                      />
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

function KPI({
  label,
  value,
  color,
  big,
}: {
  label: string;
  value: string;
  color: "emerald" | "sky" | "violet" | "amber" | "indigo";
  big?: boolean;
}) {
  const colorCls: Record<typeof color, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
  };
  return (
    <div className={clsx("border-2 rounded-xl p-3", colorCls[color])}>
      <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
      <p
        className={clsx(
          "font-bold font-mono tabular-nums mt-0.5",
          big ? "text-2xl" : "text-lg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
