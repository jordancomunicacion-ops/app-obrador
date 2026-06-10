import { auth, currentOrgId } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import { currentLocationId } from "@/app/lib/auth/location";
import { currentBusinessId } from "@/app/lib/auth/business";
import { prisma } from "@/app/lib/prisma";

/**
 * Ámbito (scope) resuelto para la petición actual, base del aislamiento por local.
 *
 * - `platform`: propietario de plataforma (SUPERADMIN) → ve TODO (cross-tenant).
 * - `location`: usuario normal → un único local activo dentro de su cuenta.
 * - `none`: sin sesión o sin local accesible → no debe ver nada (fail-closed).
 */
export type Scope =
  | { kind: "platform" }
  | { kind: "location"; locationId: string; orgId: string }
  | { kind: "none" };

/**
 * Resuelve el ámbito del usuario actual.
 *
 * El propietario de plataforma tiene ámbito global. El resto opera sobre su
 * local activo (cookie de local, validada contra su cuenta en `location.ts`).
 */
export async function currentScope(): Promise<Scope> {
  const session = await auth();
  if (!session?.user?.id) return { kind: "none" };

  if (isPlatformOwner(session)) {
    // Sin cuenta activa ("Todas las cuentas") → ámbito global.
    const accountId = await currentBusinessId();
    if (!accountId) return { kind: "platform" };
    // Con cuenta activa → opera como esa cuenta, acotado a su local activo.
    const locationId = await currentLocationId();
    if (!locationId) return { kind: "none" }; // cuenta sin local → fail-closed
    return { kind: "location", locationId, orgId: accountId };
  }

  const orgId = await currentOrgId();
  const locationId = await currentLocationId();
  if (!orgId || !locationId) return { kind: "none" };
  return { kind: "location", locationId, orgId };
}

/**
 * Fragmento `where` de Prisma que restringe una consulta al local activo por
 * `locationId`. Pensado para componerse con el resto del `where`:
 *
 *   const recipes = await prisma.recipe.findMany({
 *     where: { ...(await locationScope()), name: { contains: q } },
 *   });
 *
 * - Plataforma → `{}` (sin restricción: ve todos los locales).
 * - Local      → `{ locationId }`.
 * - Sin ámbito → filtro imposible (`fail-closed`: no devuelve nada).
 */
export async function locationScope(): Promise<Record<string, unknown>> {
  const scope = await currentScope();
  switch (scope.kind) {
    case "platform":
      return {};
    case "location":
      return { locationId: scope.locationId };
    case "none":
      return { id: "__no_scope__" };
  }
}

/**
 * `locationId` que debe asignarse al CREAR una entidad acotada por local.
 *
 * Usa el local activo del usuario (también para el propietario de plataforma,
 * que crea en el local seleccionado). Devuelve `null` si no hay local activo,
 * lo que el llamador debe tratar como "no se puede crear sin local".
 */
export async function scopedLocationId(): Promise<string | null> {
  const scope = await currentScope();
  if (scope.kind === "location") return scope.locationId;
  // Plataforma (o sin org): usa el local activo seleccionado, si lo hay.
  return currentLocationId();
}

/**
 * `locationId` a usar al crear una entidad cuando el formulario indica
 * explícitamente un local (p. ej. al crear desde la ficha de un local que no
 * es el activo). Solo se acepta si el local pertenece a la cuenta del usuario
 * (el propietario de plataforma puede usar cualquiera); si no, se cae al
 * local activo (`scopedLocationId`).
 */
export async function resolveSubmittedLocationId(submitted: unknown): Promise<string | null> {
  if (typeof submitted === "string" && submitted) {
    const loc = await prisma.location.findUnique({
      where: { id: submitted },
      select: { businessId: true },
    });
    if (loc) {
      const session = await auth();
      if (isPlatformOwner(session)) return submitted;
      const orgId = await currentOrgId();
      if (orgId && loc.businessId === orgId) return submitted;
    }
  }
  return scopedLocationId();
}

/**
 * Sanea una ruta de retorno enviada por formulario: solo rutas internas del
 * dashboard, para no redirigir fuera de la app.
 */
export function safeReturnTo(submitted: unknown): string | null {
  if (typeof submitted === "string" && submitted.startsWith("/dashboard")) return submitted;
  return null;
}
