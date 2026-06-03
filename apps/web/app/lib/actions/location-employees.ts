"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import { currentBusinessId } from "@/app/lib/auth/business";

/**
 * Gestión de empleados desde el detalle de un local (modelo unificado:
 * Employment es ahora el único sistema de acceso a la app).
 *
 * Quien tiene un Employment activo en una Empresa de un Business puede entrar
 * a ese Business; los flags `canViewX` del Employment definen qué secciones ve.
 * Asignar un Employment a un local le permite ver tareas/empleados de ese local
 * vía la API y los filtros internos.
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

const AddSchema = z.object({
    email: z.string().trim().toLowerCase().email("Email inválido."),
    password: z.string().optional(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    dni: z.string().trim().optional(),
    position: z.string().trim().optional(),
});

/** Verifica que el usuario puede gestionar este local; devuelve businessId del local. */
async function assertCanManageLocation(locationId: string): Promise<string> {
    const session = await auth();
    const isOwner = isPlatformOwner(session);
    const activeBusinessId = await currentBusinessId();

    const location = await prisma.location.findUnique({
        where: { id: locationId },
        select: { businessId: true },
    });
    if (!location?.businessId) throw new Error("El local no pertenece a ninguna empresa.");
    if (!isOwner && location.businessId !== activeBusinessId) {
        throw new Error("No tienes acceso a este local.");
    }
    return location.businessId;
}

/** Garantiza que el business tiene al menos una Empresa para colgar Employments. */
async function ensureEmpresaForBusiness(businessId: string) {
    const empresa = await prisma.empresa.findFirst({
        where: { businessId, isActive: true },
        orderBy: { createdAt: "asc" },
    });
    if (empresa) return empresa;

    const business = await prisma.business.findUnique({ where: { id: businessId }, select: { name: true } });
    return prisma.empresa.create({
        data: {
            razonSocial: business?.name ?? "Empresa principal",
            businessId,
        },
    });
}

/**
 * Añade un empleado al local: crea (o reutiliza) el User, asegura Empresa y
 * crea un Employment activo asignado a este local con los permisos indicados.
 *
 * Si el usuario ya tiene un Employment activo en una Empresa del mismo Business,
 * añadimos este local a sus `assignedLocations` en vez de crear un Employment
 * duplicado.
 */
export async function addEmployeeToLocation(
    locationId: string,
    input: z.input<typeof AddSchema>,
    perms?: Partial<AccessPermissions>,
) {
    try {
        const businessId = await assertCanManageLocation(locationId);
        const parsed = AddSchema.safeParse(input);
        if (!parsed.success) {
            return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
        }
        const { email, password, firstName, lastName, dni, position } = parsed.data;

        // 1) Crear/reutilizar User.
        const hashed = password && password.length >= 6 ? await bcrypt.hash(password, 10) : null;
        const fullName = ([firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0]).trim();
        const user = await prisma.user.upsert({
            where: { email },
            create: {
                email,
                password: hashed ?? (await bcrypt.hash(crypto.randomUUID(), 10)),
                name: fullName,
                firstName: firstName || null,
                lastName: lastName || null,
                dni: dni || null,
                role: "USER",
                approved: true,
            },
            update: {
                ...(hashed ? { password: hashed } : {}),
                ...(firstName ? { firstName } : {}),
                ...(lastName ? { lastName } : {}),
                ...(dni ? { dni } : {}),
                approved: true,
            },
        });

        // 2) Empresa del business (crearla si aún no hay).
        const empresa = await ensureEmpresaForBusiness(businessId);

        // 3) ¿Existe ya un Employment activo en este business?
        const existing = await prisma.employment.findFirst({
            where: { userId: user.id, isActive: true, empresa: { businessId } },
            select: { id: true, assignedLocations: { select: { id: true } } },
        });

        const safePerms: Partial<AccessPermissions> = {};
        for (const key of PERMS_KEYS) {
            if (perms && key in perms) safePerms[key] = !!perms[key];
        }

        if (existing) {
            // Añadir este local a sus locales asignados + actualizar permisos.
            const alreadyHere = existing.assignedLocations.some((l) => l.id === locationId);
            await prisma.employment.update({
                where: { id: existing.id },
                data: {
                    ...safePerms,
                    ...(alreadyHere ? {} : { assignedLocations: { connect: { id: locationId } } }),
                },
            });
        } else {
            await prisma.employment.create({
                data: {
                    userId: user.id,
                    empresaId: empresa.id,
                    position: position || null,
                    isActive: true,
                    assignedLocations: { connect: { id: locationId } },
                    ...DEFAULT_PERMS,
                    ...safePerms,
                },
            });
        }

        revalidatePath(`/dashboard/settings/locations/${locationId}`);
        return { ok: true as const };
    } catch (e) {
        return { ok: false as const, error: (e as Error).message };
    }
}

/** Actualiza los flags de permisos de un Employment concreto. */
export async function updateEmploymentPermissions(
    employmentId: string,
    perms: Partial<AccessPermissions>,
) {
    try {
        const emp = await prisma.employment.findUnique({
            where: { id: employmentId },
            select: { empresa: { select: { businessId: true } }, assignedLocations: { select: { id: true } } },
        });
        if (!emp?.empresa?.businessId) throw new Error("Empleo no encontrado.");

        const session = await auth();
        if (!isPlatformOwner(session)) {
            const activeBusinessId = await currentBusinessId();
            if (emp.empresa.businessId !== activeBusinessId) throw new Error("No autorizado.");
        }

        const safePerms: Partial<AccessPermissions> = {};
        for (const key of PERMS_KEYS) if (key in perms) safePerms[key] = !!perms[key];
        await prisma.employment.update({ where: { id: employmentId }, data: safePerms });

        for (const loc of emp.assignedLocations) {
            revalidatePath(`/dashboard/settings/locations/${loc.id}`);
        }
        return { ok: true as const };
    } catch (e) {
        return { ok: false as const, error: (e as Error).message };
    }
}

/**
 * Quita el local de los `assignedLocations` del Employment. Si era el único,
 * desactiva el contrato (no se borra para preservar histórico laboral).
 */
export async function removeEmployeeFromLocation(employmentId: string, locationId: string) {
    try {
        const emp = await prisma.employment.findUnique({
            where: { id: employmentId },
            select: { empresa: { select: { businessId: true } }, assignedLocations: { select: { id: true } } },
        });
        if (!emp?.empresa?.businessId) throw new Error("Empleo no encontrado.");

        const session = await auth();
        if (!isPlatformOwner(session)) {
            const activeBusinessId = await currentBusinessId();
            if (emp.empresa.businessId !== activeBusinessId) throw new Error("No autorizado.");
        }

        const remaining = emp.assignedLocations.filter((l) => l.id !== locationId);
        await prisma.employment.update({
            where: { id: employmentId },
            data: {
                assignedLocations: { disconnect: { id: locationId } },
                ...(remaining.length === 0 ? { isActive: false, endDate: new Date() } : {}),
            },
        });
        revalidatePath(`/dashboard/settings/locations/${locationId}`);
        return { ok: true as const };
    } catch (e) {
        return { ok: false as const, error: (e as Error).message };
    }
}
