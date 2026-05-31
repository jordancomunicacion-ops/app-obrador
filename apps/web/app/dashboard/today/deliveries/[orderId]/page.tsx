import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import DeliveryReceiver from "@/app/ui/orders/delivery-receiver";

export default async function ReceiveDeliveryPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const order = await prisma.purchaseOrder.findFirst({
    where: {
      id: orderId,
      ownerId: orgId,
      status: { in: ["SENT", "RECEIVED"] },
    },
    include: {
      supplier: { select: { name: true } },
      lines: true,
    },
  });
  if (!order) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/today/deliveries"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>
      <h1 className="text-xl font-semibold text-gray-800 mb-1">{order.supplier.name}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {order.reference ?? `#${order.id.slice(-6)}`}
        {order.expectedDate && ` · Esperado ${new Date(order.expectedDate).toLocaleDateString("es-ES")}`}
      </p>
      <DeliveryReceiver
        orderId={order.id}
        lines={order.lines.map((l) => ({
          id: l.id,
          productName: l.productName,
          unit: l.unit,
          quantity: l.quantity,
          receivedQuantity: l.receivedQuantity,
        }))}
      />
    </div>
  );
}
