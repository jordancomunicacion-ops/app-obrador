import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";

/**
 * Multi-tenant del obrador (basado en CRM/reservas, adaptado al modelo laboral).
 *
 * Conceptos:
 *  - `Business`   = el negocio/cliente. Gestionado por el super admin.
 *  - `Empresa`    = razón social (empleador legal) dentro de un Business.
 *  - `Location`   = local físico de una Empresa.
 *  - `Employment` = contrato laboral (User + Empresa + Locations asignados +
 *    flags de permisos sobre la app). ES el mecanismo de acceso.
 *  - Super admin (gerencia@sotodelprior.com) ve todo cross-tenant.
 *  - Cookie `selected_business_id` guarda el negocio activo.
 */

export const BUSINESS_COOKIE = "selected_business_id";

export type BusinessOption = {
  id: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
};

export type BusinessPermissions = {
  canViewDashboard: boolean;
  canViewEvents: boolean;
  canViewTasks: boolean;
  canViewCommunications: boolean;
  canViewCatalog: boolean;
  canViewOperations: boolean;
  canViewObrador: boolean;
  canViewEcommerce: boolean;
  canViewEmployees: boolean;
  canManageDirectory: boolean;
  canEditSettings: boolean;
  /** true si es super admin (gerencia) — implica acceso total */
  isPlatformOwner: boolean;
};

export const ALL_PERMISSIONS: BusinessPermissions = {
  canViewDashboard: true,
  canViewEvents: true,
  canViewTasks: true,
  canViewCommunications: true,
  canViewCatalog: true,
  canViewOperations: true,
  canViewObrador: true,
  canViewEcommerce: true,
  canViewEmployees: true,
  canManageDirectory: true,
  canEditSettings: true,
  isPlatformOwner: true,
};

const EMPTY_PERMISSIONS: BusinessPermissions = {
  canViewDashboard: false,
  canViewEvents: false,
  canViewTasks: false,
  canViewCommunications: false,
  canViewCatalog: false,
  canViewOperations: false,
  canViewObrador: false,
  canViewEcommerce: false,
  canViewEmployees: false,
  canManageDirectory: false,
  canEditSettings: false,
  isPlatformOwner: false,
};

/**
 * Lista los negocios visibles para el usuario actual:
 *  - Super admin → todos.
 *  - User dueño legacy (User.id == Business.id) → su business.
 *  - Empleado con `Employment` activo en una Empresa de un business → ese business.
 */
export async function listBusinessesForCurrentUser(): Promise<BusinessOption[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  if (isPlatformOwner(session)) {
    return prisma.business.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, domain: true, logoUrl: true },
    });
  }

  // Empleos activos del usuario → empresas → businesses
  const employments = await prisma.employment.findMany({
    where: { userId, isActive: true },
    select: { empresa: { select: { businessId: true } } },
  });
  const businessIdsFromEmployment = employments
    .map((e) => e.empresa?.businessId)
    .filter((id): id is string => !!id);

  // Dueño legacy: usuario cuyo id coincide con un Business.id.
  const ownedBusiness = await prisma.business.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (ownedBusiness) businessIdsFromEmployment.push(ownedBusiness.id);

  if (businessIdsFromEmployment.length === 0) return [];
  return prisma.business.findMany({
    where: { id: { in: Array.from(new Set(businessIdsFromEmployment)) } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, domain: true, logoUrl: true },
  });
}

/** Negocio activo: cookie validada, o el primero accesible (auto-fallback). */
export async function currentBusinessId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(BUSINESS_COOKIE)?.value ?? null;

  const session = await auth();
  if (!session?.user?.email) return null;
  const isOwner = isPlatformOwner(session);

  // Super admin sin cookie = "todos los negocios" (null = ámbito global).
  if (isOwner && !cookieVal) return null;

  const accessible = await listBusinessesForCurrentUser();
  if (accessible.length === 0) return null;

  if (cookieVal && accessible.some((b) => b.id === cookieVal)) return cookieVal;
  if (!isOwner) return accessible[0].id;
  return null;
}

/**
 * Permisos del usuario actual sobre el negocio activo (o uno concreto).
 *
 *  - Super admin → ALL_PERMISSIONS.
 *  - Dueño legacy (User.id == Business.id) → ALL_PERMISSIONS.
 *  - Empleado con Employment activo en una Empresa de este business → sus flags
 *    (si tiene varios Employments, se hace OR de los flags).
 *  - Sin nada → EMPTY_PERMISSIONS (fail-closed).
 */
export async function getBusinessPermissions(
  businessId?: string | null,
): Promise<BusinessPermissions> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ...EMPTY_PERMISSIONS };
  if (isPlatformOwner(session)) return { ...ALL_PERMISSIONS };

  const targetId = businessId ?? (await currentBusinessId());
  if (!targetId) return { ...EMPTY_PERMISSIONS };

  // Dueño legacy del business: acceso total.
  if (userId === targetId) return { ...ALL_PERMISSIONS };

  // Buscar Employment activo en una Empresa de este business.
  const employments = await prisma.employment.findMany({
    where: {
      userId,
      isActive: true,
      empresa: { businessId: targetId },
    },
    select: {
      canViewDashboard: true,
      canViewEvents: true,
      canViewTasks: true,
      canViewCommunications: true,
      canViewCatalog: true,
      canViewOperations: true,
      canViewObrador: true,
      canViewEcommerce: true,
      canViewEmployees: true,
      canManageDirectory: true,
      canEditSettings: true,
    },
  });
  if (employments.length === 0) return { ...EMPTY_PERMISSIONS };

  // OR de flags entre múltiples contratos activos.
  const merged: BusinessPermissions = { ...EMPTY_PERMISSIONS };
  for (const e of employments) {
    for (const key of Object.keys(merged) as (keyof BusinessPermissions)[]) {
      if (key === "isPlatformOwner") continue;
      if ((e as Record<string, boolean>)[key]) merged[key] = true;
    }
  }
  return merged;
}

/**
 * Guard server-side: si el usuario no tiene el permiso indicado sobre la
 * empresa activa, redirige a `/dashboard`. El super admin pasa siempre.
 */
export async function requirePermission(
  key: keyof Omit<BusinessPermissions, "isPlatformOwner">,
): Promise<BusinessPermissions> {
  const perms = await getBusinessPermissions();
  if (!perms.isPlatformOwner && !perms[key]) {
    redirect("/dashboard");
  }
  return perms;
}
