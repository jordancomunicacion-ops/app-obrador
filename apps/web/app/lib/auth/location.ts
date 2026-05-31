import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";

export const LOCATION_COOKIE = "active_location_id";

export type ActiveLocation = {
  id: string;
  name: string;
  shortCode: string | null;
};

/**
 * Construye el filtro Prisma de locales visibles para el usuario actual,
 * según la jerarquía Plataforma → Cliente → Empresa → Local:
 *
 * - Propietario de plataforma (SUPERADMIN): ve TODOS los locales (cross-tenant).
 * - Cliente/tenant (ADMIN): ve todos los locales de su cuenta (ownerId == su id).
 * - Empleado (USER): ve SOLO los locales a los que su contrato (Employment) le
 *   asigna. Sin contrato/asignación → ningún local (fail-closed). Se incluye la
 *   pertenencia directa legada (`User.locationId`) como respaldo.
 *
 * Devuelve `null` si no hay sesión, lo que los llamadores interpretan como
 * "ningún local".
 */
async function locationScopeWhere(): Promise<Record<string, unknown> | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (isPlatformOwner(session)) {
    // Sin filtro por owner: todos los locales activos de todas las cuentas.
    return { isActive: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      adminId: true,
      locationId: true,
      employments: {
        where: { isActive: true },
        select: { assignedLocations: { select: { id: true } } },
      },
    },
  });
  if (!user) return null;

  // Cliente/tenant: todos los locales de su cuenta.
  if (user.role === "ADMIN") {
    return { ownerId: user.id, isActive: true };
  }

  // Empleado: solo los locales asignados por su(s) contrato(s), + pertenencia legada.
  const assigned = new Set<string>();
  for (const emp of user.employments) {
    for (const loc of emp.assignedLocations) assigned.add(loc.id);
  }
  if (user.locationId) assigned.add(user.locationId);

  if (assigned.size === 0) {
    // Sin asignación → fail-closed: ningún local.
    return { id: "__no_assigned_location__" };
  }
  return { id: { in: Array.from(assigned) }, isActive: true };
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
