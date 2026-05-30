import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/lib/auth/location";
import { parseDateRange } from "@/lib/reports/kpi";
import DateRangeFilter from "@/app/ui/tasks/date-range-filter";
import { PrinterIcon, TagIcon } from "@heroicons/react/24/outline";

const STORAGE_LABEL: Record<string, string> = {
  AMBIENT: "Ambiente",
  REFRIGERATED: "Refrigerado",
  FROZEN: "Congelado",
};

export default async function LabelsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const range = parseDateRange(sp);

  const labels = await prisma.productLabel.findMany({
    where: {
      ownerId: orgId,
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      productionDate: { gte: range.from, lte: range.to },
    },
    include: {
      createdBy: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const defaultFrom = range.from.toISOString().slice(0, 10);
  const defaultTo = range.to.toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <TagIcon className="w-6 h-6" />
          Etiquetas
        </h1>
        <Link
          href="/dashboard/today/labels"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Crear etiqueta
        </Link>
      </div>

      <DateRangeFilter defaultFrom={defaultFrom} defaultTo={defaultTo} />

      {labels.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
          No hay etiquetas en este rango.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Lote</th>
                <th className="px-3 py-2">Elaboración</th>
                <th className="px-3 py-2">Caducidad</th>
                <th className="px-3 py-2">Conservación</th>
                <th className="px-3 py-2">Alérgenos</th>
                <th className="px-3 py-2">Local</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labels.map((l) => {
                const expired = l.expiryDate && new Date(l.expiryDate) < today;
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{l.productName}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{l.lotNumber ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {new Date(l.productionDate).toLocaleDateString("es-ES")}
                    </td>
                    <td className={clsx("px-3 py-2 text-xs", expired && "text-red-600 font-semibold")}>
                      {l.expiryDate ? new Date(l.expiryDate).toLocaleDateString("es-ES") : "—"}
                      {expired && " ⚠"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{STORAGE_LABEL[l.storageMode]}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {l.allergens.length > 0 ? l.allergens.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{l.location?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/dashboard/labels/${l.id}/print`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-xs"
                      >
                        <PrinterIcon className="w-3.5 h-3.5" />
                        Imprimir
                      </Link>
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
