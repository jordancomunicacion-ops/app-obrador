"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import type { EmployeeRequestType } from "@prisma/client";

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

  await prisma.employeeRequest.create({
    data: {
      ownerId: orgId,
      workerId: session.user.id,
      type: data.type,
      startDate: start,
      endDate: end,
      reason: data.reason?.trim() || null,
    },
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

export async function approveRequest(id: string, decision?: string) {
  const { adminId, orgId } = await assertOwnerAdmin();
  const req = await prisma.employeeRequest.findFirst({
    where: { id, ownerId: orgId, status: "PENDING" },
  });
  if (!req) throw new Error("Not found or not pending");
  await prisma.employeeRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      resolverUserId: adminId,
      resolvedAt: new Date(),
      decision: decision?.trim() || null,
    },
  });
  revalidatePath("/dashboard/requests");
}

export async function rejectRequest(id: string, decision?: string) {
  const { adminId, orgId } = await assertOwnerAdmin();
  const req = await prisma.employeeRequest.findFirst({
    where: { id, ownerId: orgId, status: "PENDING" },
  });
  if (!req) throw new Error("Not found or not pending");
  await prisma.employeeRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      resolverUserId: adminId,
      resolvedAt: new Date(),
      decision: decision?.trim() || null,
    },
  });
  revalidatePath("/dashboard/requests");
}
