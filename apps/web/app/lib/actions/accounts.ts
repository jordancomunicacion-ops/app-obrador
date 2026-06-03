"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
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

// Permisos por defecto de una cuenta cliente nueva (acceso completo a su ámbito).
const DEFAULT_ACCOUNT_PERMISSIONS = [
  "dashboard", "events", "tasks", "menu-planning",
  "products", "recipes", "purchasing", "storage",
  "mise-en-place", "employees", "settings",
];

const CreateBusinessSchema = z.object({
  businessName: z.string().trim().min(1, "El nombre del negocio es obligatorio."),
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  locationName: z.string().trim().optional(),
});

export type CreateBusinessState = {
  errors?: {
    businessName?: string[];
    email?: string[];
    password?: string[];
    locationName?: string[];
  };
  message?: string;
};

/**
 * Alta de una cuenta de negocio/restaurante por el propietario de plataforma.
 *
 * Crea el usuario `ADMIN` (la cuenta/tenant) ya aprobado y, con él, un **local
 * inicial** para que la cuenta no nazca vacía. No requiere auto-registro: este es
 * el flujo "el super admin crea el negocio y da acceso" (estilo CRM/reservas).
 */
export async function createBusinessAccount(
  _prevState: CreateBusinessState | undefined,
  formData: FormData,
): Promise<CreateBusinessState> {
  const session = await auth();
  if (!isPlatformOwner(session)) {
    return { message: "No autorizado: solo el propietario de plataforma puede crear cuentas." };
  }

  const parsed = CreateBusinessSchema.safeParse({
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    password: formData.get("password"),
    locationName: formData.get("locationName") || undefined,
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Revisa los campos del formulario.",
    };
  }

  const { businessName, email, password, locationName } = parsed.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const localName = locationName && locationName.length > 0 ? locationName : businessName;

  try {
    // Usuario ADMIN (cuenta) + local inicial en una sola transacción.
    await prisma.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: {
          name: businessName,
          email,
          password: hashedPassword,
          role: "ADMIN",
          approved: true,
          adminId: null, // es la raíz de su propia cuenta
          permissions: DEFAULT_ACCOUNT_PERMISSIONS,
        },
      });

      await tx.location.create({
        data: { name: localName, ownerId: admin.id },
      });
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { errors: { email: ["Ya existe una cuenta con ese email."] }, message: "Email duplicado." };
    }
    console.error("createBusinessAccount error:", error);
    return { message: "Error de base de datos: no se pudo crear la cuenta." };
  }

  revalidatePath("/dashboard/employees");
  redirect("/dashboard/employees?tab=requests");
}
