"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import { ACCOUNT_COOKIE } from "@/app/lib/auth/account";
import { LOCATION_COOKIE } from "@/app/lib/auth/location";

/**
 * Fija (o limpia) la cuenta cliente activa del propietario de plataforma.
 *
 * - `accountId` = `id` de un usuario `ADMIN` → opera como esa cuenta.
 * - `accountId` = `null` → "Todas las cuentas" (ámbito global de plataforma).
 *
 * Solo el propietario de plataforma puede usarlo. Al cambiar de cuenta se borra
 * el local activo, porque los locales pertenecen a la cuenta anterior.
 */
export async function setActiveAccount(accountId: string | null) {
  const session = await auth();
  if (!isPlatformOwner(session)) throw new Error("Unauthorized");

  const cookieStore = await cookies();

  if (!accountId) {
    cookieStore.delete(ACCOUNT_COOKIE);
    cookieStore.delete(LOCATION_COOKIE);
    revalidatePath("/dashboard");
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { id: accountId, role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("Account not found");

  cookieStore.set(ACCOUNT_COOKIE, admin.id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 año
  });
  // El local activo pertenecía a la cuenta anterior: limpiarlo.
  cookieStore.delete(LOCATION_COOKIE);

  revalidatePath("/dashboard");
}
