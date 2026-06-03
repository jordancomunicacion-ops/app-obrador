import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { ArrowLeftIcon, TagIcon } from "@heroicons/react/24/outline";
import LabelForm from "@/app/ui/labels/label-form";
import { getObradorLabelSource } from "@/app/lib/actions/product-labels";

export default async function LabelsMobilePage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; productId?: string; batchId?: string }>;
}) {
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locationId = await currentLocationId();
  const sp = await searchParams;

  const [recent, source] = await Promise.all([
    prisma.productLabel.findMany({
      where: {
        businessId: orgId,
        ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getObradorLabelSource(),
  ]);

  const initialDestination = sp.destination === "sale" ? "SALE" : "INTERNAL";

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/today"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="text-xl font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <TagIcon className="w-5 h-5" />
        Nueva etiqueta
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Trazabilidad interna o etiqueta de venta según el destino
      </p>

      <LabelForm
        source={source}
        initialDestination={initialDestination}
        initialProductId={sp.productId ?? ""}
        initialBatchId={sp.batchId ?? ""}
      />

      {recent.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Últimas etiquetas
          </h2>
          <div className="space-y-2">
            {recent.map((l) => (
              <Link
                key={l.id}
                href={`/dashboard/labels/${l.id}/print`}
                target="_blank"
                className="block bg-white border border-gray-200 rounded-xl p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{l.productName}</p>
                    <p className="text-xs text-gray-500">
                      {l.lotNumber && `Lote ${l.lotNumber} · `}
                      {new Date(l.productionDate).toLocaleDateString("es-ES")}
                      {l.expiryDate &&
                        ` → Cad ${new Date(l.expiryDate).toLocaleDateString("es-ES")}`}
                    </p>
                  </div>
                  <span
                    className={
                      (l.destination === "SALE"
                        ? "bg-emerald-50 text-emerald-700 "
                        : "bg-gray-100 text-gray-600 ") +
                      "text-[10px] font-medium px-2 py-0.5 rounded-full"
                    }
                  >
                    {l.destination === "SALE" ? "Venta" : "Producción"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
