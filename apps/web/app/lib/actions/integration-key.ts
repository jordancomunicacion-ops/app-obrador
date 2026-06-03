"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { currentBusinessId } from "@/app/lib/auth/business";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";

/**
 * Gestiona la API key de integración (lectura) **por LOCAL**. La consume el CRM
 * para tirar de operarios y tareas de un local concreto. Cada local tiene su
 * propia clave: rotar una no afecta a las del resto.
 *
 * Autorización: el usuario debe ser super admin O tener acceso a la empresa
 * dueña del local (verificación vía `currentBusinessId()`).
 */

export type LocationWithKey = {
  id: string;
  name: string;
  shortCode: string | null;
  apiKey: string | null;
  apiKeyCreatedAt: Date | null;
};

/**
 * Lista los locales del negocio activo con la API key actual de cada uno (o
 * null si todavía no se ha generado).
 */
export async function listLocationsWithKeys(): Promise<LocationWithKey[]> {
  const session = await auth();
  const isOwner = isPlatformOwner(session);
  const businessId = await currentBusinessId();

  // Sin negocio activo: super admin ve TODOS los locales; el resto, ninguno.
  if (!businessId && !isOwner) return [];

  const locations = await prisma.location.findMany({
    where: businessId ? { businessId, isActive: true } : { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      shortCode: true,
      apiKeys: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { key: true, createdAt: true },
      },
    },
  });

  return locations.map((l) => ({
    id: l.id,
    name: l.name,
    shortCode: l.shortCode,
    apiKey: l.apiKeys[0]?.key ?? null,
    apiKeyCreatedAt: l.apiKeys[0]?.createdAt ?? null,
  }));
}

/**
 * Verifica que el usuario puede gestionar la API key de un local concreto.
 * Devuelve `businessId` del local si pasa; lanza si no.
 */
async function assertCanManageLocation(locationId: string): Promise<{ businessId: string | null }> {
  const session = await auth();
  const isOwner = isPlatformOwner(session);
  const activeBusinessId = await currentBusinessId();

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, businessId: true },
  });
  if (!location) throw new Error("Local no encontrado.");

  if (isOwner) return { businessId: location.businessId };

  // Para no-superadmins: el local debe pertenecer al business activo.
  if (!activeBusinessId || location.businessId !== activeBusinessId) {
    throw new Error("No tienes acceso a este local.");
  }
  return { businessId: location.businessId };
}

/**
 * Rota (o genera por primera vez) la API key de un local. Una clave por local:
 * borramos las anteriores antes de crear la nueva. Así rotar invalida
 * automáticamente la previa (el CRM deja de poder leer hasta pegar la nueva).
 */
export async function rotateIntegrationKey(
  locationId: string,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  try {
    await assertCanManageLocation(locationId);
    const key = crypto.randomBytes(24).toString("base64url");
    await prisma.$transaction([
      prisma.integrationApiKey.deleteMany({ where: { locationId } }),
      prisma.integrationApiKey.create({ data: { locationId, key } }),
    ]);
    revalidatePath("/dashboard/settings/integration");
    return { ok: true, key };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Revoca la API key de un local sin generar una nueva. */
export async function revokeIntegrationKey(
  locationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertCanManageLocation(locationId);
    await prisma.integrationApiKey.deleteMany({ where: { locationId } });
    revalidatePath("/dashboard/settings/integration");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
