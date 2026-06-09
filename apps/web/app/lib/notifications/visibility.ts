import "server-only";
import type { Prisma, Department } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import { currentBusinessId, getBusinessPermissions } from "@/app/lib/auth/business";

/**
 * Ámbito laboral del usuario en el negocio activo: su departamento (área) y los
 * locales a los que está asignado. Leído de su Employment activo.
 */
export async function getCurrentEmploymentScope(
  businessId: string,
): Promise<{ department: Department | null; locationIds: string[] }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { department: null, locationIds: [] };
  const emp = await prisma.employment.findFirst({
    where: { userId, isActive: true, empresa: { businessId } },
    select: { department: true, assignedLocations: { select: { id: true } } },
  });
  return {
    department: emp?.department ?? null,
    locationIds: emp?.assignedLocations.map((l) => l.id) ?? [],
  };
}

export type NotificationVisibility = {
  /** null = no autenticado (no mostrar nada). */
  where: Prisma.NotificationWhereInput | null;
  currentUserId: string | null;
  /** true si el usuario ve notificaciones de otras personas (supervisor/admin). */
  isSupervisorView: boolean;
};

/**
 * Filtro de la bandeja según quién mira. El alcance del supervisor es por
 * LOCAL + ÁREA: sólo sus locales asignados, y dentro de ellos su departamento
 * (GENERAL = todas las áreas de esos locales → admin/encargado del local).
 *
 *  - Super admin → todas (acotadas al negocio activo si hay uno seleccionado).
 *  - ADMIN del negocio / dueño legacy → todas las del negocio (todos los locales).
 *  - Supervisor (canViewAllNotifications) → las suyas + las de su área en sus locales.
 *  - Trabajador → sólo las suyas.
 */
export async function getNotificationVisibility(): Promise<NotificationVisibility> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { where: null, currentUserId: null, isSupervisorView: false };

  const role = (session!.user as any).role ?? "USER";
  const businessId = await currentBusinessId();

  // 1. Super admin: todo (acotado al negocio activo si hay cookie).
  if (isPlatformOwner(session)) {
    return {
      where: businessId ? { businessId } : {},
      currentUserId: userId,
      isSupervisorView: true,
    };
  }

  // Sin negocio activo resoluble: sólo lo propio (fail-safe).
  if (!businessId) {
    return { where: { userId }, currentUserId: userId, isSupervisorView: false };
  }

  // 2. ADMIN del negocio o dueño legacy: todas las del negocio (todos los locales).
  if (role === "ADMIN" || userId === businessId) {
    return { where: { businessId }, currentUserId: userId, isSupervisorView: true };
  }

  // 3. Supervisor por permiso: las suyas + las de su área en sus locales asignados.
  const perms = await getBusinessPermissions(businessId);
  if (perms.canViewAllNotifications) {
    const { department, locationIds } = await getCurrentEmploymentScope(businessId);

    // Ámbito de local: sus locales asignados; si no tiene ninguno, todo el negocio.
    const locationScope: Prisma.NotificationWhereInput =
      locationIds.length > 0 ? { locationId: { in: locationIds } } : { businessId };

    // Ámbito de área: su departamento; GENERAL = todas las áreas de esos locales.
    const teamScope: Prisma.NotificationWhereInput =
      department && department !== "GENERAL"
        ? { AND: [locationScope, { department }] }
        : locationScope;

    return {
      where: { OR: [{ userId }, teamScope] },
      currentUserId: userId,
      isSupervisorView: true,
    };
  }

  // 4. Trabajador: sólo las suyas.
  return { where: { userId }, currentUserId: userId, isSupervisorView: false };
}
