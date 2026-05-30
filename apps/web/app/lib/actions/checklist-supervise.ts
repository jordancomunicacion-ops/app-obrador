"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";

async function assertCanSupervise(responseId: string) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  const response = await prisma.checklistResponse.findFirst({
    where: {
      id: responseId,
      instance: { schedule: { ownerId: orgId } },
    },
    include: {
      instance: {
        select: {
          id: true,
          schedule: {
            select: { supervisorUserIds: true, supervisorRoles: true },
          },
        },
      },
    },
  });
  if (!response) throw new Error("Response not found");

  const role = (session.user as any).role ?? "USER";
  const isOwner = session.user.id === orgId;
  const isSupervisor =
    response.instance.schedule.supervisorUserIds.includes(session.user.id) ||
    response.instance.schedule.supervisorRoles.includes(role);
  if (!isOwner && !isSupervisor) throw new Error("Forbidden");
  return { response, userId: session.user.id };
}

export async function markResponseSupervised(responseId: string, supervised: boolean) {
  const { response, userId } = await assertCanSupervise(responseId);
  await prisma.checklistResponse.update({
    where: { id: response.id },
    data: {
      supervisedByUserId: supervised ? userId : null,
      supervisedAt: supervised ? new Date() : null,
    },
  });
  revalidatePath(`/dashboard/tasks/supervise/${response.instance.id}`);
  revalidatePath("/dashboard/tasks/supervise");
}

export async function markInstanceSupervised(instanceId: string) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  const instance = await prisma.checklistInstance.findFirst({
    where: { id: instanceId, schedule: { ownerId: orgId } },
    include: {
      schedule: { select: { supervisorUserIds: true, supervisorRoles: true } },
      responses: { select: { id: true, supervisedAt: true } },
    },
  });
  if (!instance) throw new Error("Instance not found");
  const role = (session.user as any).role ?? "USER";
  const isOwner = session.user.id === orgId;
  const isSupervisor =
    instance.schedule.supervisorUserIds.includes(session.user.id) ||
    instance.schedule.supervisorRoles.includes(role);
  if (!isOwner && !isSupervisor) throw new Error("Forbidden");

  const now = new Date();
  await prisma.$transaction(
    instance.responses
      .filter((r) => !r.supervisedAt)
      .map((r) =>
        prisma.checklistResponse.update({
          where: { id: r.id },
          data: { supervisedByUserId: session.user!.id, supervisedAt: now },
        }),
      ),
  );
  revalidatePath(`/dashboard/tasks/supervise/${instanceId}`);
  revalidatePath("/dashboard/tasks/supervise");
}
