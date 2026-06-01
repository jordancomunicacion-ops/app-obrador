import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { PlusIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import PageHeader from "@/app/ui/primitives/page-header";
import Button from "@/app/ui/primitives/button";
import Badge from "@/app/ui/primitives/badge";
import EmptyState from "@/app/ui/primitives/empty-state";

const STATUS_TONE: Record<string, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  DRAFT: "neutral",
  SENT: "accent",
  RECEIVED: "warning",
  CLOSED: "success",
  CANCELLED: "danger",
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
      <PageHeader
        icon={<ShoppingCartIcon className="w-6 h-6" />}
        title="Pedidos a proveedores"
        actions={
          <Button href="/dashboard/purchasing/orders/new">
            <PlusIcon className="w-4 h-4" />
            Nuevo pedido
          </Button>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCartIcon className="w-12 h-12" />}
          title="No hay pedidos."
          description="Crea el primer pedido a un proveedor."
          action={
            <Button href="/dashboard/purchasing/orders/new">
              <PlusIcon className="w-4 h-4" />
              Nuevo pedido
            </Button>
          }
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
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
                      className="font-medium text-gray-800 hover:text-[var(--accent-soft-contrast)]"
                    >
                      {o.reference ?? `#${o.id.slice(-6)}`}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{o.supplier.name}</td>
                  <td className="px-4 py-2 text-center">
                    <Badge tone={STATUS_TONE[o.status] ?? "neutral"}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-center text-gray-700">{o._count.lines}</td>
                  <td className="px-4 py-2 text-center text-gray-700">{o._count.deliveryNotes}</td>
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
