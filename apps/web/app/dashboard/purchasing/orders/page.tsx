import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { PlusIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";

const STATUS_CLS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-amber-100 text-amber-700",
  CLOSED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  RECEIVED: "Recibido",
  CLOSED: "Cerrado",
  CANCELLED: "Cancelado",
};

export default async function OrdersPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const orders = await prisma.purchaseOrder.findMany({
    where: { ownerId: orgId },
    include: {
      supplier: { select: { name: true } },
      _count: { select: { lines: true, deliveryNotes: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <ShoppingCartIcon className="w-6 h-6" />
          Pedidos a proveedores
        </h1>
        <Link
          href="/dashboard/purchasing/orders/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <PlusIcon className="w-4 h-4" />
          Nuevo pedido
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
          No hay pedidos. Crea el primero.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2">Referencia</th>
                <th className="px-4 py-2">Proveedor</th>
                <th className="px-4 py-2 text-center">Estado</th>
                <th className="px-4 py-2 text-center">Líneas</th>
                <th className="px-4 py-2 text-center">Albaranes</th>
                <th className="px-4 py-2">Esperado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/purchasing/orders/${o.id}`}
                      className="font-medium text-gray-800 hover:text-indigo-600"
                    >
                      {o.reference ?? `#${o.id.slice(-6)}`}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{o.supplier.name}</td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        STATUS_CLS[o.status],
                      )}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-gray-700">{o._count.lines}</td>
                  <td className="px-4 py-2 text-center text-gray-700">
                    {o._count.deliveryNotes}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {o.expectedDate
                      ? new Date(o.expectedDate).toLocaleDateString("es-ES")
                      : "—"}
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
