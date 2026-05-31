import { auth, currentOrgId } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import { currentLocationId } from "@/app/lib/auth/location";

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
  if (isPlatformOwner(session)) return { kind: "platform" };

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
