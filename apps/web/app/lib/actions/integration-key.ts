"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { currentAccountId } from "@/app/lib/auth/account";

/**
 * Gestiona la API key de integración (lectura) de la cuenta actual. La consume
 * el CRM para tirar de operarios y tareas. SUPERADMIN sin cuenta activa no
 * puede operar — debe seleccionar una cuenta primero.
 */

export type CurrentKey = { key: string; createdAt: Date } | null;

export async function getCurrentIntegrationKey(): Promise<CurrentKey> {
  const businessId = await currentAccountId();
  if (!businessId) return null;
  const row = await prisma.integrationApiKey.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    select: { key: true, createdAt: true },
  });
  return row ?? null;
}

export async function rotateIntegrationKey(): Promise<
  { ok: true; key: string } | { ok: false; error: string }
> {
  const businessId = await currentAccountId();
  if (!businessId) {
    return { ok: false, error: "No hay cuenta activa." };
  }
  const key = crypto.randomBytes(24).toString("base64url");
  // Una clave por cuenta: borramos las anteriores antes de crear la nueva. Así
  // rotar invalida automáticamente la previa (el CRM deja de poder leer hasta
  // pegar la nueva clave).
  await prisma.$transaction([
    prisma.integrationApiKey.deleteMany({ where: { businessId } }),
    prisma.integrationApiKey.create({ data: { businessId, key } }),
  ]);
  revalidatePath("/dashboard/settings/integration");
  return { ok: true, key };
}
