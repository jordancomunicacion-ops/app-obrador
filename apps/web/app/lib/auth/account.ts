import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";

/**
 * Cuenta cliente (tenant) activa para el propietario de plataforma.
 *
 * Patrón análogo al selector de LOCAL (`active_location_id`), pero un nivel más
 * arriba: el propietario de plataforma (SUPERADMIN) puede fijar sobre qué
 * **cuenta cliente** (`ownerId`, es decir, un usuario `ADMIN`) opera. Sin cuenta
 * fijada, mantiene su ámbito global ("Todas las cuentas").
 *
 * Para `ADMIN`/`USER` la cuenta es siempre la suya (la cookie se ignora): el
 * selector solo se ofrece al propietario de plataforma.
 */
export const ACCOUNT_COOKIE = "active_account_id";

export type AccountOption = {
  id: string;
  name: string | null;
  email: string | null;
  empresa: string | null;
};

/**
 * Cuentas cliente seleccionables.
 * - Propietario de plataforma: todas las cuentas (usuarios `ADMIN`).
 * - Resto: vacío (no usan selector).
 */
export async function listAccounts(): Promise<AccountOption[]> {
  const session = await auth();
  if (!isPlatformOwner(session)) return [];

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      ownedEmpresas: {
        select: { razonSocial: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return admins.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    empresa: a.ownedEmpresas[0]?.razonSocial ?? null,
  }));
}

/**
 * Cuenta (tenant) sobre la que opera la petición actual.
 *
 * - Propietario de plataforma: la cookie validada (debe ser un `ADMIN`
 *   existente) o `null` si no ha fijado ninguna ("Todas las cuentas").
 * - `ADMIN`: su propio `id`.
 * - `USER`: el `adminId` de su cuenta.
 *
 * Devuelve `null` cuando no hay una cuenta concreta sobre la que operar.
 */
export async function currentAccountId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  if (isPlatformOwner(session)) {
    const cookieStore = await cookies();
    const val = cookieStore.get(ACCOUNT_COOKIE)?.value;
    if (!val) return null; // "Todas las cuentas"
    const admin = await prisma.user.findFirst({
      where: { id: val, role: "ADMIN" },
      select: { id: true },
    });
    return admin?.id ?? null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, adminId: true },
  });
  if (!user) return null;
  return user.role === "ADMIN" ? user.id : user.adminId ?? null;
}

/**
 * Identificador de organización efectivo para acotar consultas/creaciones.
 *
 * Alias semántico de `currentAccountId()` pensado para reemplazar
 * progresivamente a `currentOrgId()` en los consumidores: honra la cuenta
 * activa del propietario de plataforma además de la organización propia de
 * `ADMIN`/`USER`.
 */
export async function effectiveOrgId(): Promise<string | null> {
  return currentAccountId();
}
