"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { sendPushToUser } from "@/lib/push/send";
import type { EmployeeRequestType } from "@prisma/client";

const REQ_TYPE_LABEL: Record<EmployeeRequestType, string> = {
  HOLIDAY: "Vacaciones",
  SICK_LEAVE: "Baja médica",
  PERSONAL: "Asuntos propios",
  SHIFT_SWAP: "Cambio de turno",
  OTHER: "Solicitud",
};

export async function createRequest(data: {
  type: EmployeeRequestType;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  reason?: string | null;
}) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  if (!data.startDate) throw new Error("Start date required");

  const start = new Date(`${data.startDate}T00:00:00.000Z`);
  const end = data.endDate ? new Date(`${data.endDate}T00:00:00.000Z`) : null;
  if (end && end < start) throw new Error("End date before start date");

  const created = await prisma.employeeRequest.create({
    data: {
      ownerId: orgId,
      workerId: session.user.id,
      type: data.type,
      startDate: start,
      endDate: end,
      reason: data.reason?.trim() || null,
    },
    include: { worker: { select: { name: true } } },
  });

  // Avisar al admin del cliente
  await sendPushToUser(orgId, {
    title: `${REQ_TYPE_LABEL[data.type]}: ${created.worker.name}`,
    body:
      `${start.toLocaleDateString("es-ES")}` +
      (end ? ` → ${end.toLocaleDateString("es-ES")}` : "") +
      (data.reason ? ` · ${data.reason.slice(0, 60)}` : ""),
    url: "/dashboard/requests",
    tag: `request-${created.id}`,
  });

  revalidatePath("/dashboard/today/requests");
  revalidatePath("/dashboard/requests");
}

export async function cancelMyRequest(id: string) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  const req = await prisma.employeeRequest.findFirst({
    where: { id, ownerId: orgId, workerId: session.user.id },
  });
  if (!req) throw new Error("Not found");
  if (req.status !== "PENDING") throw new Error("Solo se pueden cancelar solicitudes pendientes");

  await prisma.employeeRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/dashboard/today/requests");
  revalidatePath("/dashboard/requests");
}

async function assertOwnerAdmin() {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId || session.user.id !== orgId) {
    throw new Error("Forbidden");
  }
  return { adminId: session.user.id, orgId };
}

async function resolveRequest(id: string, kind: "APPROVED" | "REJECTED", decision?: string) {
  const { adminId, orgId } = await assertOwnerAdmin();
  const req = await prisma.employeeRequest.findFirst({
    where: { id, ownerId: orgId, status: "PENDING" },
  });
  if (!req) throw new Error("Not found or not pending");
  await prisma.employeeRequest.update({
    where: { id },
    data: {
      status: kind,
      resolverUserId: adminId,
      resolvedAt: new Date(),
      decision: decision?.trim() || null,
    },
  });
  // Push al trabajador
  await sendPushToUser(req.workerId, {
    title: `Tu ${REQ_TYPE_LABEL[req.type].toLowerCase()} ha sido ${
      kind === "APPROVED" ? "aprobada ✅" : "rechazada ❌"
    }`,
    body:
      `${req.startDate.toLocaleDateString("es-ES")}` +
      (req.endDate ? ` → ${req.endDate.toLocaleDateString("es-ES")}` : "") +
      (decision ? ` · ${decision.slice(0, 80)}` : ""),
    url: "/dashboard/today/requests",
    tag: `request-${id}`,
  });
  revalidatePath("/dashboard/requests");
}

export async function approveRequest(id: string, decision?: string) {
  return resolveRequest(id, "APPROVED", decision);
}

export async function rejectRequest(id: string, decision?: string) {
  return resolveRequest(id, "REJECTED", decision);
}
