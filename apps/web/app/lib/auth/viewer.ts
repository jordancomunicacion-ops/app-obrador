import "server-only";
import type { Department } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import { currentBusinessId, getBusinessPermissions } from "@/app/lib/auth/business";
import { getCurrentEmploymentScope } from "@/app/lib/notifications/visibility";

/**
 * Quién mira, en términos de jerarquía del negocio:
 *
 *  - Dirección (`isManager`): super admin, ADMIN del negocio o dueño legacy.
 *    Ve todo el negocio (tareas, comunicaciones, notificaciones).
 *  - Encargado (`isSupervisor`): Employment con `canViewAllNotifications`.
 *    Ve lo de su área en sus locales asignados (jefe de sala/cocina, encargado).
 *  - Trabajador (ninguno de los dos): camarero, ayudante... sólo ve LO SUYO
 *    (sus tareas asignadas, sus notificaciones, sus comunicaciones).
 */
export type ViewerContext = {
  userId: string | null;
  businessId: string | null;
  isManager: boolean;
  isSupervisor: boolean;
  /** Área y locales del Employment activo (vacíos para dirección sin contrato). */
  department: Department | null;
  locationIds: string[];
};

export async function getViewerContext(): Promise<ViewerContext> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const empty: ViewerContext = {
    userId,
    businessId: null,
    isManager: false,
    isSupervisor: false,
    department: null,
    locationIds: [],
  };
  if (!userId) return empty;

  const businessId = await currentBusinessId();
  if (isPlatformOwner(session)) return { ...empty, businessId, isManager: true };
  if (!businessId) return empty;

  const role = (session!.user as { role?: string }).role ?? "USER";
  if (role === "ADMIN" || userId === businessId) {
    return { ...empty, businessId, isManager: true };
  }

  const perms = await getBusinessPermissions(businessId);
  const { department, locationIds } = await getCurrentEmploymentScope(businessId);
  return {
    userId,
    businessId,
    isManager: false,
    isSupervisor: perms.canViewAllNotifications,
    department,
    locationIds,
  };
}

export type Recipient = { id: string; name: string };

/**
 * A quién puede dirigir comunicaciones el usuario actual:
 *
 *  - Dirección y encargados → cualquier persona del negocio.
 *  - Trabajador → SOLO sus encargados (supervisores de su área en sus locales)
 *    y la dirección del negocio. La dirección y los encargados ven después la
 *    comunicación por su propia visibilidad ampliada.
 */
export async function getAllowedRecipients(viewer?: ViewerContext): Promise<Recipient[]> {
  const v = viewer ?? (await getViewerContext());
  if (!v.userId || !v.businessId) return [];

  // Dueño legacy del negocio (User.id == Business.id), si existe como usuario.
  const owner = await prisma.user.findUnique({
    where: { id: v.businessId },
    select: { id: true, name: true },
  });

  if (v.isManager || v.isSupervisor) {
    const emps = await prisma.employment.findMany({
      where: { isActive: true, empresa: { businessId: v.businessId } },
      select: { user: { select: { id: true, name: true } } },
    });
    return dedupe([...(owner ? [owner] : []), ...emps.map((e) => e.user)], v.userId);
  }

  // Trabajador: encargados de su área en sus locales + ADMINs del negocio.
  const sups = await prisma.employment.findMany({
    where: {
      isActive: true,
      empresa: { businessId: v.businessId },
      OR: [{ canViewAllNotifications: true }, { user: { role: "ADMIN" } }],
    },
    select: {
      department: true,
      user: { select: { id: true, name: true, role: true } },
      assignedLocations: { select: { id: true } },
    },
  });
  const matches = sups.filter((s) => {
    if (s.user.role === "ADMIN") return true; // gerencia del negocio
    const locs = s.assignedLocations.map((l) => l.id);
    const sharesLocation =
      v.locationIds.length === 0 ||
      locs.length === 0 ||
      locs.some((id) => v.locationIds.includes(id));
    const sharesArea =
      s.department === "GENERAL" ||
      !v.department ||
      v.department === "GENERAL" ||
      s.department === v.department;
    return sharesLocation && sharesArea;
  });
  return dedupe(
    [...matches.map((s) => ({ id: s.user.id, name: s.user.name })), ...(owner ? [owner] : [])],
    v.userId,
  );
}

function dedupe(list: Recipient[], excludeId: string): Recipient[] {
  const seen = new Set<string>([excludeId]);
  const out: Recipient[] = [];
  for (const r of list) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
