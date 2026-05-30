/**
 * Identidad del propietario de plataforma (rol "ve todo", cross-tenant).
 *
 * Patrón multi-tenant compartido con CRM / reservas / ganadería: por encima
 * del cliente (tenant) existe un propietario de plataforma con acceso global.
 *
 * Hasta ahora ese rol se comprobaba con el email `gerencia@sotodelprior.com`
 * hardcodeado en varios sitios. Este módulo lo centraliza y, además, reconoce
 * el rol `SUPERADMIN` como forma canónica de propietario de plataforma.
 *
 * Importante: este módulo es PURO (sin Prisma ni dependencias de servidor),
 * por lo que puede importarse tanto desde componentes de servidor como desde
 * `auth.ts` o utilidades cliente.
 */

/** Email del propietario de plataforma (legado, se mantiene por retrocompatibilidad). */
export const PLATFORM_OWNER_EMAIL = "gerencia@sotodelprior.com";

/** Rol canónico de propietario de plataforma (acceso cross-tenant). */
export const PLATFORM_ROLE = "SUPERADMIN";

/** ¿Este email corresponde al propietario de plataforma? (case-insensitive) */
export function isPlatformOwnerEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === PLATFORM_OWNER_EMAIL;
}

type SessionLike = {
  user?: {
    email?: string | null;
    role?: string | null;
  } | null;
} | null;

/**
 * ¿Esta sesión pertenece al propietario de plataforma (ve todo, cross-tenant)?
 *
 * Es verdadero si el usuario tiene el rol `SUPERADMIN` o, por retrocompatibilidad,
 * si su email es el del propietario de plataforma legado.
 */
export function isPlatformOwner(session?: SessionLike): boolean {
  const user = session?.user;
  if (!user) return false;
  return user.role === PLATFORM_ROLE || isPlatformOwnerEmail(user.email);
}
