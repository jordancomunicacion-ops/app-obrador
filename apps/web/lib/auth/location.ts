import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";

export const LOCATION_COOKIE = "active_location_id";

export type ActiveLocation = {
  id: string;
  name: string;
  shortCode: string | null;
};

/**
 * Devuelve los locales del cliente actual.
 */
export async function listLocations(): Promise<ActiveLocation[]> {
  const orgId = await currentOrgId();
  if (!orgId) return [];
  return prisma.location.findMany({
    where: { ownerId: orgId, isActive: true },
    select: { id: true, name: true, shortCode: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Local activo seleccionado por el usuario en la cookie, o el primero del cliente.
 * Devuelve null si el cliente no tiene ningún local.
 */
export async function currentLocationId(): Promise<string | null> {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCATION_COOKIE)?.value;

  if (cookieValue) {
    const valid = await prisma.location.findFirst({
      where: { id: cookieValue, ownerId: orgId, isActive: true },
      select: { id: true },
    });
    if (valid) return valid.id;
  }

  const first = await prisma.location.findFirst({
    where: { ownerId: orgId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true },
  });
  return first?.id ?? null;
}

export async function currentLocation(): Promise<ActiveLocation | null> {
  const id = await currentLocationId();
  if (!id) return null;
  return prisma.location.findUnique({
    where: { id },
    select: { id: true, name: true, shortCode: true },
  });
}
