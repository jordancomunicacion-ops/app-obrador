"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";

async function assertOwner(id: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const o = await prisma.purchaseOrder.findFirst({
    where: { id, ownerId: orgId },
    select: { id: true, status: true },
  });
  if (!o) throw new Error("Order not found");
  return { orgId, order: o };
}

export async function createOrder(data: {
  supplierId: string;
  reference?: string;
  expectedDate?: string | null;
  notes?: string;
}) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, OR: [{ ownerId: orgId }, { ownerId: null }] },
  });
  if (!supplier) throw new Error("Supplier not found");

  const order = await prisma.purchaseOrder.create({
    data: {
      ownerId: orgId,
      createdByUserId: session.user.id,
      supplierId: data.supplierId,
      reference: data.reference?.trim() || null,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      notes: data.notes?.trim() || null,
    },
  });
  revalidatePath("/dashboard/purchasing/orders");
  redirect(`/dashboard/purchasing/orders/${order.id}`);
}

export async function updateOrder(
  id: string,
  data: { reference?: string | null; expectedDate?: string | null; notes?: string | null },
) {
  const { order } = await assertOwner(id);
  if (order.status === "CLOSED" || order.status === "CANCELLED") {
    throw new Error("Pedido no editable");
  }
  await prisma.purchaseOrder.update({
    where: { id },
    data: {
      reference: data.reference === undefined ? undefined : data.reference?.trim() || null,
      expectedDate:
        data.expectedDate === undefined
          ? undefined
          : data.expectedDate
            ? new Date(data.expectedDate)
            : null,
      notes: data.notes === undefined ? undefined : data.notes?.trim() || null,
    },
  });
  revalidatePath(`/dashboard/purchasing/orders/${id}`);
}

export async function addLine(
  orderId: string,
  data: {
    supplierProductId?: string | null;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice?: number | null;
  },
) {
  const { orgId, order } = await assertOwner(orderId);
  if (order.status !== "DRAFT") throw new Error("Solo se editan líneas en borrador");

  // Si trae supplierProductId, autocompletar nombre/unit/price desde catálogo
  let productName = data.productName.trim();
  let unit = data.unit;
  let unitPrice = data.unitPrice ?? null;
  if (data.supplierProductId) {
    const sp = await prisma.supplierProduct.findFirst({
      where: { id: data.supplierProductId },
    });
    if (sp) {
      productName = productName || sp.name;
      unit = unit || sp.unit;
      unitPrice = unitPrice ?? sp.price;
    }
  }

  if (!productName) throw new Error("Nombre obligatorio");
  if (!data.quantity || data.quantity <= 0) throw new Error("Cantidad inválida");

  await prisma.purchaseOrderLine.create({
    data: {
      orderId,
      supplierProductId: data.supplierProductId ?? null,
      productName,
      unit: unit || "UD",
      quantity: data.quantity,
      unitPrice,
    },
  });
  revalidatePath(`/dashboard/purchasing/orders/${orderId}`);
}

export async function updateLine(
  lineId: string,
  data: { productName?: string; unit?: string; quantity?: number; unitPrice?: number | null },
) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const line = await prisma.purchaseOrderLine.findFirst({
    where: { id: lineId, order: { ownerId: orgId } },
    include: { order: { select: { id: true, status: true } } },
  });
  if (!line) throw new Error("Line not found");
  if (line.order.status !== "DRAFT") throw new Error("Solo se editan líneas en borrador");
  await prisma.purchaseOrderLine.update({
    where: { id: lineId },
    data: {
      productName: data.productName?.trim(),
      unit: data.unit,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
    },
  });
  revalidatePath(`/dashboard/purchasing/orders/${line.order.id}`);
}

export async function removeLine(lineId: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const line = await prisma.purchaseOrderLine.findFirst({
    where: { id: lineId, order: { ownerId: orgId } },
    include: { order: { select: { id: true, status: true } } },
  });
  if (!line) throw new Error("Line not found");
  if (line.order.status !== "DRAFT") throw new Error("Solo se editan líneas en borrador");
  await prisma.purchaseOrderLine.delete({ where: { id: lineId } });
  revalidatePath(`/dashboard/purchasing/orders/${line.order.id}`);
}

export async function sendOrder(orderId: string) {
  const { order } = await assertOwner(orderId);
  if (order.status !== "DRAFT") throw new Error("Solo se pueden enviar borradores");
  const linesCount = await prisma.purchaseOrderLine.count({ where: { orderId } });
  if (linesCount === 0) throw new Error("Añade al menos una línea antes de enviar");
  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: "SENT", sentAt: new Date() },
  });
  revalidatePath(`/dashboard/purchasing/orders/${orderId}`);
  revalidatePath("/dashboard/purchasing/orders");
}

export async function cancelOrder(orderId: string) {
  const { order } = await assertOwner(orderId);
  if (order.status === "CLOSED") throw new Error("No se puede cancelar un pedido cerrado");
  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
  revalidatePath(`/dashboard/purchasing/orders/${orderId}`);
}

/**
 * Recibir mercancía: genera un DeliveryNote y actualiza recvQty por línea,
 * marca el pedido como RECEIVED (no cierra automáticamente).
 */
export async function receiveOrder(
  orderId: string,
  data: {
    receivedLines: { lineId: string; qty: number }[];
    photoUrls?: string[];
    signatureSvg?: string | null;
    note?: string | null;
  },
) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");
  const order = await prisma.purchaseOrder.findFirst({
    where: { id: orderId, ownerId: orgId },
    include: { lines: true },
  });
  if (!order) throw new Error("Order not found");
  if (order.status !== "SENT" && order.status !== "RECEIVED") {
    throw new Error("El pedido no está en estado SENT/RECEIVED");
  }

  // Persistir cantidades recibidas
  await prisma.$transaction([
    ...data.receivedLines.map((rl) =>
      prisma.purchaseOrderLine.update({
        where: { id: rl.lineId },
        data: {
          receivedQuantity: { increment: rl.qty },
        },
      }),
    ),
    prisma.deliveryNote.create({
      data: {
        orderId,
        receivedByUserId: session.user!.id,
        photoUrls: data.photoUrls ?? [],
        signatureSvg: data.signatureSvg ?? null,
        note: data.note?.trim() || null,
        receivedLines: data.receivedLines,
      },
    }),
    prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: "RECEIVED" },
    }),
  ]);

  revalidatePath(`/dashboard/purchasing/orders/${orderId}`);
  revalidatePath("/dashboard/today/deliveries");
}

export async function closeOrder(orderId: string) {
  const { order } = await assertOwner(orderId);
  if (order.status !== "RECEIVED") throw new Error("Solo se cierran pedidos recibidos");
  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  revalidatePath(`/dashboard/purchasing/orders/${orderId}`);
  revalidatePath("/dashboard/purchasing/orders");
}
