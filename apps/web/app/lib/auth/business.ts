import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";

/**
 * Multi-tenant moderno (modelo CRM/reservas).
 *
 * Conceptos:
 *  - `Business`   = el negocio/marca/cliente final.
 *  - `BusinessAccess (email, businessId, can*)` = quién entra a qué negocio.
 *  - Super admin (gerencia@sotodelprior.com) ve todos los negocios y puede
 *    crear/eliminar; el resto solo los suyos (vía BusinessAccess.email).
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
  canViewEmployees: boolean;
  canManageDirectory: boolean;
  canEditSettings: boolean;
  /** true si es super admin (gerencia) — implica acceso total */
  isPlatformOwner: boolean;
};

/** Permisos completos del super admin. */
export const ALL_PERMISSIONS: BusinessPermissions = {
  canViewDashboard: true,
  canViewEvents: true,
  canViewTasks: true,
  canViewCommunications: true,
  canViewCatalog: true,
  canViewOperations: true,
  canViewObrador: true,
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
  canViewEmployees: false,
  canManageDirectory: false,
  canEditSettings: false,
  isPlatformOwner: false,
};

/**
 * Devuelve los negocios visibles para el usuario actual:
 *  - Super admin → todos los `Business`.
 *  - Resto → los `Business` donde su email tenga un `BusinessAccess`.
 */
export async function listBusinessesForCurrentUser(): Promise<BusinessOption[]> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) return [];

  const isOwner = isPlatformOwner(session);
  if (isOwner) {
    return prisma.business.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, domain: true, logoUrl: true },
    });
  }

  return prisma.business.findMany({
    where: { accessEntries: { some: { email: { equals: email, mode: "insensitive" } } } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, domain: true, logoUrl: true },
  });
}

/**
 * Negocio activo: cookie validada contra los negocios accesibles, o el primero
 * disponible. `null` si el usuario no tiene ninguno (o si es super admin sin
 * cookie seleccionada — eso significa "Todos los negocios").
 */
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

  // Para usuarios no-super-admin: si la cookie no es válida, devuelve el
  // primer negocio accesible (auto-fallback como hace el CRM).
  if (!isOwner) return accessible[0].id;

  // Super admin con cookie inválida: respeta "todos los negocios".
  return null;
}

/**
 * Permisos del usuario actual sobre el negocio activo (o uno concreto).
 * Super admin → `ALL_PERMISSIONS`.
 */
export async function getBusinessPermissions(
  businessId?: string | null,
): Promise<BusinessPermissions> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) return { ...EMPTY_PERMISSIONS };
  if (isPlatformOwner(session)) return { ...ALL_PERMISSIONS };

  const targetId = businessId ?? (await currentBusinessId());
  if (!targetId) return { ...EMPTY_PERMISSIONS };

  const access = await prisma.businessAccess.findFirst({
    where: { businessId: targetId, email: { equals: email, mode: "insensitive" } },
  });
  if (!access) return { ...EMPTY_PERMISSIONS };

  return {
    canViewDashboard: access.canViewDashboard,
    canViewEvents: access.canViewEvents,
    canViewTasks: access.canViewTasks,
    canViewCommunications: access.canViewCommunications,
    canViewCatalog: access.canViewCatalog,
    canViewOperations: access.canViewOperations,
    canViewObrador: access.canViewObrador,
    canViewEmployees: access.canViewEmployees,
    canManageDirectory: access.canManageDirectory,
    canEditSettings: access.canEditSettings,
    isPlatformOwner: false,
  };
}

/**
 * Guard server-side: si el usuario no tiene el permiso indicado sobre la
 * empresa activa, redirige a `/dashboard`. El super admin pasa siempre.
 *
 * Pensado para llamarse desde un `layout.tsx` o `page.tsx` server-side al
 * inicio del render. Idempotente y barato (cachea por request gracias a
 * Next.js).
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
