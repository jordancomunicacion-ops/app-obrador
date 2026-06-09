"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

/**
 * Marca una notificación concreta como leída (validando que es del usuario).
 * Se llama al pulsar/entrar en la notificación. Revalida el layout del dashboard
 * para que el contador de la campana se actualice en cualquier ruta.
 */
export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard", "layout");
}

/**
 * Marca como leídas TODAS las del usuario (acción opcional "marcar todas como
 * leídas"). No se ejecuta automáticamente al abrir la bandeja.
 */
export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard", "layout");
}

/** Nº de notificaciones no leídas del usuario actual (para la campana). */
export async function getUnreadNotificationCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });
}
