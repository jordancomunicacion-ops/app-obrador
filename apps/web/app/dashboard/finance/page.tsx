import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { parseDateRange } from "@/app/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";
import EntryForm from "@/app/ui/finance/entry-form";
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

const TYPE_LABEL: Record<string, string> = {
  INCOME: "Ingreso",
  EXPENSE_OPERATING: "Operativo",
  EXPENSE_PAYROLL: "Nómina",
  EXPENSE_SUPPLIER: "Proveedor",
  EXPENSE_OTHER: "Otro",
};

const TYPE_CLS: Record<string, string> = {
  INCOME: "bg-emerald-100 text-emerald-700",
  EXPENSE_OPERATING: "bg-rose-100 text-rose-700",
  EXPENSE_PAYROLL: "bg-violet-100 text-violet-700",
  EXPENSE_SUPPLIER: "bg-amber-100 text-amber-700",
  EXPENSE_OTHER: "bg-gray-200 text-gray-700",
};

function eur(n: number): string {
  return n.toFixed(2);
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const range = parseDateRange(sp);

  const entries = await prisma.financialEntry.findMany({
    where: {
      ownerId: orgId,
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      date: { gte: range.from, lte: range.to },
    },
    include: {
      createdBy: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: { date: "desc" },
    take: 500,
  });

  const income = entries
    .filter((e) => e.type === "INCOME")
    .reduce((s, e) => s + e.amount, 0);
  const operating = entries
    .filter((e) => e.type === "EXPENSE_OPERATING")
    .reduce((s, e) => s + e.amount, 0);
  const payroll = entries
    .filter((e) => e.type === "EXPENSE_PAYROLL")
    .reduce((s, e) => s + e.amount, 0);
  const supplier = entries
    .filter((e) => e.type === "EXPENSE_SUPPLIER")
    .reduce((s, e) => s + e.amount, 0);
  const other = entries
    .filter((e) => e.type === "EXPENSE_OTHER")
    .reduce((s, e) => s + e.amount, 0);
  const totalExpenses = operating + payroll + supplier + other;
  const ebitda = income - totalExpenses;
  const margin = income > 0 ? (ebitda / income) * 100 : 0;

  const defaultFrom = range.from.toISOString().slice(0, 10);
  const defaultTo = range.to.toISOString().slice(0, 10);
  const exportUrl = `/api/finance/export?from=${defaultFrom}&to=${defaultTo}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6" />
          Finanzas / EBITDA
        </h1>
        <a
          href={exportUrl}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Exportar CSV
        </a>
      </div>

      <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <KPI label="Ingresos" value={`${eur(income)} €`} color="emerald" />
        <KPI label="Gastos totales" value={`${eur(totalExpenses)} €`} color="rose" />
        <KPI
          label="EBITDA"
          value={`${eur(ebitda)} €`}
          color={ebitda >= 0 ? "indigo" : "rose"}
          sub={income > 0 ? `Margen ${margin.toFixed(1)}%` : undefined}
          big
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KPI label="Operativo" value={`${eur(operating)} €`} color="rose" small />
        <KPI label="Nómina" value={`${eur(payroll)} €`} color="violet" small />
        <KPI label="Proveedores" value={`${eur(supplier)} €`} color="amber" small />
        <KPI label="Otros" value={`${eur(other)} €`} color="gray" small />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <EntryForm />
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Apuntes ({entries.length})
          </h2>
          {entries.length === 0 ? (
            <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
              No hay apuntes en este rango. Crea uno en el formulario de la izquierda.
            </p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Categoría</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2 text-right">Importe</th>
                    <th className="px-3 py-2 text-center">Tkt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-xs text-gray-700">
                        {new Date(e.date).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-3 py-1.5">
                        <span
                          className={clsx(
                            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                            TYPE_CLS[e.type],
                          )}
                        >
                          {TYPE_LABEL[e.type]}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-gray-800 font-medium">{e.category}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-600 truncate max-w-xs">
                        {e.description ?? "—"}
                      </td>
                      <td
                        className={clsx(
                          "px-3 py-1.5 text-right font-mono tabular-nums font-medium",
                          e.type === "INCOME" ? "text-emerald-700" : "text-rose-700",
                        )}
                      >
                        {e.type === "INCOME" ? "+" : "-"}
                        {eur(e.amount)}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {e.receiptUrl ? (
                          <a href={e.receiptUrl} target="_blank" rel="noreferrer">
                            <PhotoIcon className="w-4 h-4 inline text-gray-400 hover:text-indigo-600" />
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  color,
  sub,
  big,
  small,
}: {
  label: string;
  value: string;
  color: "emerald" | "rose" | "violet" | "amber" | "indigo" | "gray";
  sub?: string;
  big?: boolean;
  small?: boolean;
}) {
  const colorCls: Record<typeof color, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
    gray: "border-gray-200 bg-gray-50 text-gray-700",
  };
  return (
    <div className={clsx("border-2 rounded-xl p-3", colorCls[color])}>
      <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
      <p
        className={clsx(
          "font-bold font-mono tabular-nums mt-0.5",
          big ? "text-2xl" : small ? "text-base" : "text-lg",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}
