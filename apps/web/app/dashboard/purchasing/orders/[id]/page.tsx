import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { locationScope } from "@/app/lib/auth/scope";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  sendOrder,
  closeOrder,
  cancelOrder,
} from "@/app/lib/actions/purchase-orders";
import OrderLinesEditor from "@/app/ui/orders/order-lines-editor";

const STATUS_CLS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-amber-100 text-amber-700",
  CLOSED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const order = await prisma.purchaseOrder.findFirst({
    where: { id, ownerId: orgId },
    include: {
      supplier: { select: { id: true, name: true, email: true } },
      lines: { orderBy: { id: "asc" } },
      deliveryNotes: {
        include: { receivedBy: { select: { name: true } } },
        orderBy: { receivedAt: "desc" },
      },
    },
  });
  if (!order) notFound();

  const catalog = await prisma.supplierProduct.findMany({
    where: { ...(await locationScope()), supplierId: order.supplierId },
    select: { id: true, name: true, unit: true, price: true },
    orderBy: { name: "asc" },
  });

  const editable = order.status === "DRAFT";

  const sendAct = sendOrder.bind(null, order.id);
  const closeAct = closeOrder.bind(null, order.id);
  const cancelAct = cancelOrder.bind(null, order.id);

  return (
    <div>
      <Link
        href="/dashboard/purchasing/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {order.reference ?? `Pedido #${order.id.slice(-6)}`}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {order.supplier.name}
              {order.supplier.email && ` · ${order.supplier.email}`}
            </p>
          </div>
          <span
            className={clsx(
              "text-xs font-medium px-2 py-1 rounded-full",
              STATUS_CLS[order.status],
            )}
          >
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-gray-500">Esperado</p>
            <p className="font-medium">
              {order.expectedDate
                ? new Date(order.expectedDate).toLocaleDateString("es-ES")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Enviado</p>
            <p className="font-medium">
              {order.sentAt ? new Date(order.sentAt).toLocaleDateString("es-ES") : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Cerrado</p>
            <p className="font-medium">
              {order.closedAt ? new Date(order.closedAt).toLocaleDateString("es-ES") : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Albaranes</p>
            <p className="font-medium">{order.deliveryNotes.length}</p>
          </div>
        </div>

        {order.notes && (
          <p className="text-sm text-gray-600 italic mt-3 border-t border-gray-100 pt-3">
            {order.notes}
          </p>
        )}

        <div className="flex gap-2 mt-4 flex-wrap">
          {order.status === "DRAFT" && (
            <>
              <form action={sendAct}>
                <button className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg inline-flex items-center gap-1">
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />
                  Marcar como enviado
                </button>
              </form>
              <form action={cancelAct}>
                <button className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg inline-flex items-center gap-1">
                  <XMarkIcon className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </form>
            </>
          )}
          {order.status === "RECEIVED" && (
            <form action={closeAct}>
              <button className="text-xs px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg inline-flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                Cerrar pedido
              </button>
            </form>
          )}
        </div>
      </div>

      <OrderLinesEditor
        orderId={order.id}
        lines={order.lines.map((l) => ({
          id: l.id,
          productName: l.productName,
          unit: l.unit,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          receivedQuantity: l.receivedQuantity,
        }))}
        catalog={catalog.map((c) => ({
          id: c.id,
          name: c.name,
          unit: c.unit,
          price: c.price,
        }))}
        editable={editable}
      />

      {order.deliveryNotes.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Albaranes recibidos</h2>
          <div className="space-y-2">
            {order.deliveryNotes.map((dn) => (
              <div key={dn.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">
                    Recibido por {dn.receivedBy?.name ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(dn.receivedAt).toLocaleString("es-ES")}
                  </p>
                </div>
                {dn.note && <p className="text-sm text-gray-600 italic">{dn.note}</p>}
                {dn.photoUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dn.photoUrls.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
