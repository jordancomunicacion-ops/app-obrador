"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { LOCATION_COOKIE } from "@/app/lib/auth/location";

// Campos de establecimiento (datos sanitarios/fiscales) comunes a alta y edición.
function establishmentData(formData: FormData) {
  const str = (k: string) => {
    const v = ((formData.get(k) as string) ?? "").trim();
    return v || null;
  };
  const date = (k: string) => {
    const v = ((formData.get(k) as string) ?? "").trim();
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };
  return {
    companyName: str("companyName"),
    nif: str("nif"),
    phone: str("phone"),
    email: str("email"),
    activity: str("activity"),
    registryType: str("registryType"),
    registryNumber: str("registryNumber"),
    registryStatus: str("registryStatus") ?? "no_iniciado",
    region: str("region"),
    requestDate: date("requestDate"),
    resolutionDate: date("resolutionDate"),
  };
}

export async function setActiveLocation(locationId: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");

  // Verificar pertenencia: el local tiene que ser del cliente actual
  const loc = await prisma.location.findFirst({
    where: { id: locationId, ownerId: orgId },
    select: { id: true },
  });
  if (!loc) throw new Error("Location not found");

  const cookieStore = await cookies();
  cookieStore.set(LOCATION_COOKIE, loc.id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 año
  });

  revalidatePath("/dashboard");
}

export async function createLocation(formData: FormData) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  const shortCode = ((formData.get("shortCode") as string) ?? "").trim() || null;
  const address = ((formData.get("address") as string) ?? "").trim() || null;

  if (!name) throw new Error("Name required");

  await prisma.location.create({
    data: { name, shortCode, address, ownerId: orgId, ...establishmentData(formData) },
  });
  revalidatePath("/dashboard/settings/locations");
}

export async function updateLocation(id: string, formData: FormData) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const loc = await prisma.location.findFirst({ where: { id, ownerId: orgId } });
  if (!loc) throw new Error("Location not found");

  const name = (formData.get("name") as string)?.trim();
  const shortCode = ((formData.get("shortCode") as string) ?? "").trim() || null;
  const address = ((formData.get("address") as string) ?? "").trim() || null;
  const isActive = formData.get("isActive") === "on";

  await prisma.location.update({
    where: { id },
    data: { name, shortCode, address, isActive, ...establishmentData(formData) },
  });
  revalidatePath("/dashboard/settings/locations");
}

export async function deleteLocation(id: string) {
  const orgId = await currentOrgId();
  if (!orgId) throw new Error("Unauthorized");

  const loc = await prisma.location.findFirst({ where: { id, ownerId: orgId } });
  if (!loc) throw new Error("Location not found");

  await prisma.location.delete({ where: { id } });
  revalidatePath("/dashboard/settings/locations");
}
