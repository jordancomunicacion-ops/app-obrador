"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import {
  BUSINESS_COOKIE,
  listBusinessesForCurrentUser,
} from "@/app/lib/auth/business";

/**
 * Server actions de Business + BusinessAccess.
 *
 * Patrón clonado del CRM (`apps/crm/apps/web/app/crm/web/actions.ts`): el super
 * admin (gerencia@sotodelprior.com) crea/elimina negocios y concede accesos.
 * El resto solo lista los negocios donde su email tiene una fila en
 * BusinessAccess.
 */

const PERMS_KEYS = [
  "canViewDashboard",
  "canViewEvents",
  "canViewTasks",
  "canViewCommunications",
  "canViewCatalog",
  "canViewOperations",
  "canViewObrador",
  "canViewEmployees",
  "canManageDirectory",
  "canEditSettings",
] as const;

export type AccessPermissions = Record<(typeof PERMS_KEYS)[number], boolean>;

async function requirePlatformOwner() {
  const session = await auth();
  if (!isPlatformOwner(session)) {
    throw new Error("Solo el administrador de plataforma puede realizar esta acción.");
  }
}

// ---------------------------------------------------------------------------
// Listado y selector
// ---------------------------------------------------------------------------

export async function getBusinesses() {
  // Reexpone el listado (super admin → todos; resto → los suyos).
  return listBusinessesForCurrentUser();
}

export async function setSelectedBusinessId(id: string | null) {
  const cookieStore = await cookies();
  if (!id) {
    cookieStore.delete(BUSINESS_COOKIE);
  } else {
    // Validamos que el negocio existe y que el usuario tiene acceso.
    const accessible = await listBusinessesForCurrentUser();
    if (!accessible.some((b) => b.id === id)) {
      return { success: false, error: "No tienes acceso a ese negocio." };
    }
    cookieStore.set(BUSINESS_COOKIE, id, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  revalidatePath("/dashboard");
  return { success: true };
}

// ---------------------------------------------------------------------------
// CRUD Business (solo super admin)
// ---------------------------------------------------------------------------

const CreateBusinessSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  domain: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "") : null)),
  logoUrl: z.string().trim().optional().nullable(),
});

export async function createBusiness(input: {
  name: string;
  domain?: string;
  logoUrl?: string;
}) {
  try {
    await requirePlatformOwner();
    const parsed = CreateBusinessSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }
    const { name, domain, logoUrl } = parsed.data;
    if (domain) {
      const dup = await prisma.business.findUnique({ where: { domain } });
      if (dup) return { success: false, error: `Ya existe un negocio con el dominio ${domain}.` };
    }
    const business = await prisma.business.create({
      data: { name, domain, logoUrl: logoUrl || null },
    });
    revalidatePath("/dashboard/settings/empresas");
    revalidatePath("/dashboard");
    return { success: true, business };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateBusiness(
  id: string,
  data: { name?: string; domain?: string | null; logoUrl?: string | null },
) {
  try {
    await requirePlatformOwner();
    const dataToUpdate: Record<string, unknown> = {};
    if (data.name !== undefined) dataToUpdate.name = data.name.trim();
    if (data.domain !== undefined) {
      const normalized = data.domain
        ? data.domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")
        : null;
      dataToUpdate.domain = normalized;
    }
    if (data.logoUrl !== undefined) dataToUpdate.logoUrl = data.logoUrl || null;

    const business = await prisma.business.update({ where: { id }, data: dataToUpdate });
    revalidatePath("/dashboard/settings/empresas");
    return { success: true, business };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteBusiness(id: string) {
  try {
    await requirePlatformOwner();
    // Borrar accesos primero (onDelete: Cascade ya lo hace, pero explícito por claridad).
    await prisma.business.delete({ where: { id } });
    revalidatePath("/dashboard/settings/empresas");
    revalidatePath("/dashboard/settings/accesos");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Accesos (BusinessAccess)
// ---------------------------------------------------------------------------

const DEFAULT_PERMS: AccessPermissions = {
  canViewDashboard: true,
  canViewEvents: true,
  canViewTasks: true,
  canViewCommunications: true,
  canViewCatalog: true,
  canViewOperations: true,
  canViewObrador: true,
  canViewEmployees: false,
  canManageDirectory: false,
  canEditSettings: false,
};

export async function getBusinessAccess(businessId: string) {
  try {
    await requirePlatformOwner();
    const access = await prisma.businessAccess.findMany({
      where: { businessId },
      orderBy: { createdAt: "asc" },
    });
    return access.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Upsert de acceso a un negocio. Si se proporciona `password`, además se crea
 * o actualiza el `User` con ese email (con la nueva contraseña). Permite al
 * super admin "dar de alta a un cliente con sus credenciales" en un solo paso
 * (idéntico al `updateWebSiteAccess` del CRM).
 */
export async function updateBusinessAccess(
  businessId: string,
  email: string,
  permissions: Partial<AccessPermissions>,
  password?: string,
) {
  try {
    await requirePlatformOwner();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { success: false, error: "Email inválido." };
    }

    // 1) Si se pasa password: upsert del User.
    if (password) {
      if (password.length < 6) {
        return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
      }
      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.upsert({
        where: { email: normalizedEmail },
        create: {
          email: normalizedEmail,
          password: hashed,
          name: normalizedEmail.split("@")[0],
          role: "USER",
          approved: true,
        },
        update: { password: hashed, approved: true },
      });
    }

    // 2) Filtrar solo las claves de permisos válidas (defensa frente a payloads grandes).
    const safePerms: Partial<AccessPermissions> = {};
    for (const key of PERMS_KEYS) {
      if (key in permissions) safePerms[key] = !!permissions[key];
    }

    // 3) Upsert del BusinessAccess.
    const access = await prisma.businessAccess.upsert({
      where: { email_businessId: { email: normalizedEmail, businessId } },
      create: { businessId, email: normalizedEmail, ...DEFAULT_PERMS, ...safePerms },
      update: safePerms,
    });

    revalidatePath("/dashboard/settings/accesos");
    return { success: true, access };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function removeBusinessAccess(accessId: string) {
  try {
    await requirePlatformOwner();
    await prisma.businessAccess.delete({ where: { id: accessId } });
    revalidatePath("/dashboard/settings/accesos");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
