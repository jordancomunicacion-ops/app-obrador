import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { resolveIntegrationAuth } from "@/app/lib/integration-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/integrations/orders
 *
 * La tienda web reenvía aquí un pedido YA PAGADO (Stripe cobra en la web).
 * El obrador lo registra como `OnlineOrder` en el local de la clave, hace upsert
 * del cliente en el CRM (`Customer`) y deja el pedido en estado NEW para que el
 * operario lo gestione (iniciar producción, etiquetar, enviar).
 *
 * Idempotente por `paymentRef` (PaymentIntent de Stripe): si el pedido ya existe
 * se devuelve el existente, así los reintentos del webhook no duplican pedidos.
 *
 * Auth: cabecera `x-api-key` (o `Authorization: Bearer`) resuelta a un local.
 */

const ItemSchema = z.object({
  masterProductId: z.string().min(1).optional(),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  priceAtPurchase: z.number().nonnegative(),
});

const OrderSchema = z.object({
  paymentRef: z.string().min(1), // PaymentIntent id de Stripe (clave de idempotencia)
  total: z.number().nonnegative(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(ItemSchema).min(1),
});

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

export async function POST(req: NextRequest) {
  const auth = await resolveIntegrationAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos del pedido inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Idempotencia: si ya registramos este pago en este local, devolvemos el existente.
  const existing = await prisma.onlineOrder.findFirst({
    where: { locationId: auth.locationId, paymentRef: data.paymentRef },
    select: { id: true, reference: true, status: true },
  });
  if (existing) {
    return NextResponse.json(
      { ok: true, idempotent: true, order: existing },
      { status: 200 }
    );
  }

  // Validar que los productos de catálogo referenciados pertenecen a este local.
  const referencedIds = data.items
    .map((i) => i.masterProductId)
    .filter((id): id is string => !!id);
  if (referencedIds.length > 0) {
    const owned = await prisma.masterProduct.findMany({
      where: { id: { in: referencedIds }, locationId: auth.locationId },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((p) => p.id));
    const foreign = referencedIds.filter((id) => !ownedSet.has(id));
    if (foreign.length > 0) {
      return NextResponse.json(
        { error: "Algún producto no pertenece a este local", productIds: foreign },
        { status: 400 }
      );
    }
  }

  // Upsert del cliente en el CRM del local (por email dentro del local).
  let customerId: string | null = null;
  const email = data.customerEmail.trim().toLowerCase();
  const existingCustomer = await prisma.customer.findFirst({
    where: { locationId: auth.locationId, email },
    select: { id: true },
  });
  if (existingCustomer) {
    customerId = existingCustomer.id;
    await prisma.customer.update({
      where: { id: existingCustomer.id },
      data: {
        name: data.customerName,
        phone: data.phone ?? undefined,
        address: data.address ?? undefined,
      },
    });
  } else {
    const created = await prisma.customer.create({
      data: {
        name: data.customerName,
        email,
        phone: data.phone ?? null,
        address: data.address ?? null,
        customerType: "Online",
        locationId: auth.locationId,
        businessId: auth.businessId,
      },
      select: { id: true },
    });
    customerId = created.id;
  }

  // Referencia legible WEB-YYYYMMDD-NNN (secuencia diaria por local).
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayCount = await prisma.onlineOrder.count({
    where: { locationId: auth.locationId, createdAt: { gte: startOfDay } },
  });
  const reference = `WEB-${yyyymmdd}-${pad(todayCount + 1, 3)}`;

  const order = await prisma.onlineOrder.create({
    data: {
      locationId: auth.locationId,
      businessId: auth.businessId,
      reference,
      status: "NEW",
      customerName: data.customerName,
      customerEmail: email,
      phone: data.phone ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      zipCode: data.zipCode ?? null,
      notes: data.notes ?? null,
      total: data.total,
      paymentRef: data.paymentRef,
      paymentProvider: "stripe",
      customerId,
      items: {
        create: data.items.map((i) => ({
          masterProductId: i.masterProductId ?? null,
          productName: i.productName,
          quantity: i.quantity,
          priceAtPurchase: i.priceAtPurchase,
        })),
      },
    },
    select: { id: true, reference: true, status: true },
  });

  return NextResponse.json({ ok: true, order }, { status: 201 });
}
