"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import {
  BUSINESS_COOKIE,
  listBusinessesForCurrentUser,
} from "@/app/lib/auth/business";

/**
 * CRUD de Business (negocios cliente). El acceso de cada empleado a la app vive
 * en `Employment` (con flags `canViewX`), no aquí — la gestión por empleado
 * vive dentro del detalle de cada local.
 */

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
  return listBusinessesForCurrentUser();
}

export async function setSelectedBusinessId(id: string | null) {
  const cookieStore = await cookies();
  if (!id) {
    cookieStore.delete(BUSINESS_COOKIE);
  } else {
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
    await prisma.business.delete({ where: { id } });
    revalidatePath("/dashboard/settings/empresas");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
