"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { sendPushToUsers } from "@/app/lib/push/send";
import type { CommunicationType, CommunicationStatus } from "@prisma/client";

const TYPE_LABEL: Record<CommunicationType, string> = {
  BREAKDOWN: "Avería",
  NOTICE: "Aviso",
  EVENT: "Evento",
  MEETING: "Reunión",
  TASK: "Programada",
  LIST: "Lista",
};

async function assertOwnership(id: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");
  const c = await prisma.communication.findFirst({
    where: { id, businessId: orgId },
    select: { id: true },
  });
  if (!c) throw new Error("Communication not found");
  return orgId;
}

export async function createCommunication(data: {
  type: CommunicationType;
  title: string;
  description?: string;
  locationId?: string | null;
  assigneeIds?: string[];
  followerIds?: string[];
  scheduledAt?: string | null;
  photoUrls?: string[];
}) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  if (!data.title?.trim()) throw new Error("Title required");

  if (data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: data.locationId, businessId: orgId },
    });
    if (!loc) throw new Error("Invalid location");
  }

  const created = await prisma.communication.create({
    data: {
      type: data.type,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      businessId: orgId,
      authorId: session.user.id,
      locationId: data.locationId ?? null,
      assigneeIds: data.assigneeIds ?? [],
      followerIds: data.followerIds ?? [],
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      photoUrls: data.photoUrls ?? [],
    },
  });

  // Push asignados + seguidores (excluyendo al autor)
  const notifyIds = [...(data.assigneeIds ?? []), ...(data.followerIds ?? [])].filter(
    (id) => id !== session.user!.id,
  );
  if (notifyIds.length > 0) {
    await sendPushToUsers(notifyIds, {
      title: `${TYPE_LABEL[data.type]}: ${created.title}`,
      body: data.description?.slice(0, 120) || "Tienes una comunicación nueva",
      url: `/dashboard/communications/${created.id}`,
      tag: `communication-${created.id}`,
    });
  }

  revalidatePath("/dashboard/communications");
  return created;
}

export async function updateCommunication(
  id: string,
  data: {
    type: CommunicationType;
    title: string;
    description?: string;
    locationId?: string | null;
    assigneeIds?: string[];
    followerIds?: string[];
    scheduledAt?: string | null;
    photoUrls?: string[];
  },
) {
  const orgId = await assertOwnership(id);
  if (data.locationId) {
    const loc = await prisma.location.findFirst({
      where: { id: data.locationId, businessId: orgId },
    });
    if (!loc) throw new Error("Invalid location");
  }
  await prisma.communication.update({
    where: { id },
    data: {
      type: data.type,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      locationId: data.locationId ?? null,
      assigneeIds: data.assigneeIds ?? [],
      followerIds: data.followerIds ?? [],
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      photoUrls: data.photoUrls ?? [],
    },
  });
  revalidatePath("/dashboard/communications");
  revalidatePath(`/dashboard/communications/${id}`);
}

export async function changeCommunicationStatus(id: string, status: CommunicationStatus) {
  await assertOwnership(id);
  await prisma.communication.update({
    where: { id },
    data: {
      status,
      closedAt: status === "CLOSED" ? new Date() : null,
    },
  });
  revalidatePath("/dashboard/communications");
  revalidatePath(`/dashboard/communications/${id}`);
}

export async function deleteCommunication(id: string) {
  await assertOwnership(id);
  await prisma.communication.delete({ where: { id } });
  revalidatePath("/dashboard/communications");
  redirect("/dashboard/communications");
}

export async function addComment(communicationId: string, body: string, photos: string[] = []) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) throw new Error("Unauthorized");

  const c = await prisma.communication.findFirst({
    where: { id: communicationId, businessId: orgId },
    select: { id: true },
  });
  if (!c) throw new Error("Communication not found");
  if (!body.trim() && photos.length === 0) throw new Error("Empty comment");

  const created = await prisma.communicationComment.create({
    data: {
      communicationId,
      authorId: session.user.id,
      body: body.trim(),
      photos,
    },
  });

  // Push: avisamos al autor original + asignados + seguidores (sin el comentador)
  const parent = await prisma.communication.findUnique({
    where: { id: communicationId },
    select: { title: true, authorId: true, assigneeIds: true, followerIds: true },
  });
  if (parent) {
    const notifyIds = [
      parent.authorId,
      ...parent.assigneeIds,
      ...parent.followerIds,
    ].filter((id) => id !== session.user!.id);
    if (notifyIds.length > 0) {
      await sendPushToUsers(notifyIds, {
        title: `Nuevo comentario: ${parent.title}`,
        body: body.trim().slice(0, 120) || "Foto adjunta",
        url: `/dashboard/communications/${communicationId}`,
        tag: `communication-${communicationId}`,
      });
    }
  }

  revalidatePath(`/dashboard/communications/${communicationId}`);
  return created;
}
