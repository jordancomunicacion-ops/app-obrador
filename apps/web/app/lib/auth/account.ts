/**
 * Compatibilidad con el código existente.
 *
 * El modelo de obrador se ha alineado con el de CRM/reservas:
 *  - El "tenant" es ahora un `Business` (entidad propia), no un `User` ADMIN.
 *  - Quién entra a qué negocio va en `BusinessAccess` (email + businessId + flags).
 *  - El super admin (gerencia@sotodelprior.com) ve todo.
 *
 * Este fichero conserva los nombres antiguos (`currentAccountId`, `listAccounts`,
 * `effectiveOrgId`, `ACCOUNT_COOKIE`) como **alias** del nuevo helper
 * `lib/auth/business.ts`, para que los ~41 consumidores existentes sigan
 * funcionando sin cambios mientras se migran a `currentBusinessId` /
 * `listBusinessesForCurrentUser`.
 *
 * Importante: lo que antes devolvía un `User.id` (ownerId) ahora devuelve un
 * `Business.id`. Para que las queries antiguas que filtran por `ownerId` sigan
 * trayendo datos, el backfill de Fase 2 añadirá `businessId` en los 28 modelos
 * y migrará las queries.
 */

import {
  BUSINESS_COOKIE,
  currentBusinessId,
  listBusinessesForCurrentUser,
  type BusinessOption,
} from "@/app/lib/auth/business";

/** @deprecated usa BUSINESS_COOKIE */
export const ACCOUNT_COOKIE = BUSINESS_COOKIE;

/**
 * @deprecated usa BusinessOption.
 * Mapeo a los campos legacy (name, email, empresa) para componentes que aún
 * los esperan. `email` queda como null (los negocios ya no son usuarios).
 */
export type AccountOption = {
  id: string;
  name: string | null;
  email: string | null;
  empresa: string | null;
};

/** @deprecated usa listBusinessesForCurrentUser. */
export async function listAccounts(): Promise<AccountOption[]> {
  const businesses: BusinessOption[] = await listBusinessesForCurrentUser();
  return businesses.map((b) => ({ id: b.id, name: b.name, email: null, empresa: b.name }));
}

/** @deprecated usa currentBusinessId. */
export async function currentAccountId(): Promise<string | null> {
  return currentBusinessId();
}

/** @deprecated usa currentBusinessId. */
export async function effectiveOrgId(): Promise<string | null> {
  return currentBusinessId();
}
