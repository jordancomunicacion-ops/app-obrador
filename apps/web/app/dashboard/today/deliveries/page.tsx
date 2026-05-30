import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import {
  ArrowLeftIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

export default async function PendingDeliveriesPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const pending = await prisma.purchaseOrder.findMany({
    where: { ownerId: orgId, status: "SENT" },
    include: {
      supplier: { select: { name: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { expectedDate: "asc" },
  });

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
        <TruckIcon className="w-5 h-5" />
        Pedidos por recibir
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Marca como recibido cuando llegue la mercancía, con foto del albarán.
      </p>

      {pending.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
          🎉 Sin pedidos pendientes de recibir.
        </p>
      ) : (
        <div className="space-y-2">
          {pending.map((o) => (
            <Link
              key={o.id}
              href={`/dashboard/today/deliveries/${o.id}`}
              className="block bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{o.supplier.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {o.reference ?? `#${o.id.slice(-6)}`} · {o._count.lines}{" "}
                    {o._count.lines === 1 ? "línea" : "líneas"}
                  </p>
                </div>
                {o.expectedDate && (
                  <span className="text-xs text-gray-500">
                    Esperado{" "}
                    {new Date(o.expectedDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
