import "server-only";
import { prisma } from "@/app/lib/prisma";
import { sendPushToUsers, type PushPayload } from "@/app/lib/push/send";
import type { NotificationType, Department } from "@prisma/client";

/**
 * Carga útil de una notificación: extiende la de push con los datos del feed
 * persistente. `type` clasifica la notificación en la bandeja; `relatedType`/
 * `relatedId` apuntan al objeto origen para deep-link y deduplicación futura.
 */
export type NotifyPayload = PushPayload & {
  type?: NotificationType;
  relatedType?: string;
  relatedId?: string;
  businessId?: string | null;
  locationId?: string | null;
  /**
   * Área de la notificación. Si se omite, se deriva del departamento del
   * destinatario (su Employment activo). Define qué supervisor la verá.
   */
  department?: Department;
};

/**
 * Resuelve el departamento (área) de cada destinatario a partir de su Employment
 * activo. Devuelve un mapa userId → Department; los que no tengan contrato quedan
 * sin entrada y caen a GENERAL.
 */
async function resolveDepartments(
  userIds: string[],
  businessId?: string | null,
): Promise<Map<string, Department>> {
  const employments = await prisma.employment.findMany({
    where: {
      userId: { in: userIds },
      isActive: true,
      ...(businessId ? { empresa: { businessId } } : {}),
    },
    select: { userId: true, department: true },
  });
  const map = new Map<string, Department>();
  for (const e of employments) {
    // Primer contrato gana (suficiente para el caso normal de 1 contrato activo).
    if (!map.has(e.userId)) map.set(e.userId, e.department);
  }
  return map;
}

/**
 * Notifica a varios usuarios: persiste una fila en la bandeja por usuario Y
 * envía la push. Es la única vía recomendada para notificar — así campana y
 * push nunca se desincronizan. La push es best-effort (no aborta si falla).
 */
export async function notifyUsers(userIds: string[], payload: NotifyPayload): Promise<void> {
  const unique = Array.from(new Set(userIds)).filter(Boolean);
  if (unique.length === 0) return;

  // Área de cada destinatario (salvo override explícito en el payload).
  const deptMap = payload.department
    ? null
    : await resolveDepartments(unique, payload.businessId);

  // 1. Feed persistente (histórico consultable).
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      type: payload.type ?? "GENERIC",
      department: payload.department ?? deptMap?.get(userId) ?? "GENERAL",
      title: payload.title,
      body: payload.body || null,
      url: payload.url || null,
      relatedType: payload.relatedType || null,
      relatedId: payload.relatedId || null,
      businessId: payload.businessId ?? null,
      locationId: payload.locationId ?? null,
    })),
  });

  // 2. Push (canal de entrega; silent-fail por suscripción).
  await sendPushToUsers(unique, payload);
}

/** Atajo para un único destinatario. */
export async function notifyUser(userId: string, payload: NotifyPayload): Promise<void> {
  await notifyUsers([userId], payload);
}
