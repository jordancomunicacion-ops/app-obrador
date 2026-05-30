import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { isPlatformOwner } from "@/lib/auth/platform";

export const LOCATION_COOKIE = "active_location_id";

export type ActiveLocation = {
  id: string;
  name: string;
  shortCode: string | null;
};

/**
 * Construye el filtro Prisma de locales visibles para el usuario actual.
 *
 * - Propietario de plataforma (SUPERADMIN): ve TODOS los locales (cross-tenant).
 * - Resto: solo los locales de su cuenta de cliente (ownerId == org).
 *
 * Devuelve `null` si el usuario no tiene ámbito (sin sesión / sin org), lo que
 * los llamadores interpretan como "ningún local".
 */
async function locationScopeWhere(): Promise<{ ownerId?: string; isActive: boolean } | null> {
  const session = await auth();
  if (isPlatformOwner(session)) {
    // Sin filtro por owner: todos los locales activos de todas las cuentas.
    return { isActive: true };
  }
  const orgId = await currentOrgId();
  if (!orgId) return null;
  return { ownerId: orgId, isActive: true };
}

/**
 * Devuelve los locales visibles para el usuario actual.
 * El propietario de plataforma ve todos los locales (todos los clientes).
 */
export async function listLocations(): Promise<ActiveLocation[]> {
  const where = await locationScopeWhere();
  if (!where) return [];
  return prisma.location.findMany({
    where,
    select: { id: true, name: true, shortCode: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Local activo seleccionado por el usuario en la cookie, o el primero visible.
 * Devuelve null si no hay ningún local visible para el usuario.
 */
export async function currentLocationId(): Promise<string | null> {
  const where = await locationScopeWhere();
  if (!where) return null;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCATION_COOKIE)?.value;

  if (cookieValue) {
    const valid = await prisma.location.findFirst({
      where: { ...where, id: cookieValue },
      select: { id: true },
    });
    if (valid) return valid.id;
  }

  const first = await prisma.location.findFirst({
    where,
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
