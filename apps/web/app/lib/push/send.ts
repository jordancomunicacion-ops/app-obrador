import "server-only";
import webpush from "web-push";
import { prisma } from "@/app/lib/prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    console.warn(
      "[push] VAPID keys missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.",
    );
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
};

/**
 * Envía push a todas las suscripciones del usuario. Silent fail por suscripción
 * (no aborta si una está caducada — la borramos).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const payloadStr = JSON.stringify({
    ...payload,
    icon: payload.icon ?? "/logo-icon.png",
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr,
        );
      } catch (err: any) {
        // 404/410 = endpoint inválido o cancelado → limpiar
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        } else {
          console.warn("[push] send failed", err?.statusCode, err?.body);
        }
      }
    }),
  );
}

/**
 * Envía push a todos los usuarios indicados. No falla si alguno no tiene subscription.
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  if (!ensureConfigured() || userIds.length === 0) return;
  const unique = Array.from(new Set(userIds));
  await Promise.allSettled(unique.map((id) => sendPushToUser(id, payload)));
}
