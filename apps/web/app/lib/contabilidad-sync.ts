import 'server-only';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';
import { fetchContabilidadEmployees } from '@/app/lib/contabilidad';

/**
 * Sincronización de la plantilla desde el ERP de contabilidad (cruce por DNI).
 * Para cada empleado activo del ERP:
 *  - Si no existe en el obrador: crea el User (email placeholder si no tiene)
 *    y su Employment con contrato/jornada, asignado al local cuyo nombre casa
 *    con su centro de trabajo (o al primero si no casa ninguno).
 *  - Si ya existe: actualiza el contrato/jornada de su Employment con los
 *    datos del ERP (que es la fuente de la verdad laboral).
 *
 * Idempotente. La ejecuta el cron diario (/api/cron/sync-contabilidad); las
 * altas nuevas llegan al instante por el push de contabilidad
 * (POST /api/integrations/employees), esto cubre cambios y desfases.
 */

const normalizeNif = (nif: string) => nif.toUpperCase().replace(/[\s.-]/g, '');

// Permisos de un operario importado (mismos que addEmployeeToLocation).
const IMPORT_DEFAULT_PERMS = {
    canViewDashboard: true,
    canViewEvents: true,
    canViewTasks: true,
    canViewCommunications: true,
    canViewCatalog: true,
    canViewOperations: true,
    canViewObrador: true,
    canViewEcommerce: false,
    canViewEmployees: false,
    canManageDirectory: false,
    canEditSettings: false,
    canViewAllNotifications: false,
} as const;

/** Local cuyo nombre casa con el centro de trabajo del ERP; si no, el primero. */
function matchLocation(
    locations: { id: string; name: string }[],
    workCenter: string | null | undefined,
): { id: string; name: string } | null {
    if (locations.length === 0) return null;
    const wc = (workCenter ?? '').trim().toLowerCase();
    if (wc) {
        const exact = locations.find((l) => l.name.trim().toLowerCase() === wc);
        if (exact) return exact;
        const partial = locations.find(
            (l) => l.name.toLowerCase().includes(wc) || wc.includes(l.name.toLowerCase()),
        );
        if (partial) return partial;
    }
    return locations[0];
}

export async function syncPlantillaFromContabilidad(): Promise<{
    created: number;
    updated: number;
    detalles: string[];
}> {
    const plantilla = (await fetchContabilidadEmployees()).filter((e) => e.active && e.nif);
    if (plantilla.length === 0) {
        return { created: 0, updated: 0, detalles: [] };
    }

    const empresa = await prisma.empresa.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
    });
    if (!empresa) {
        throw new Error('No hay ninguna empresa activa donde registrar los contratos.');
    }
    const locations = await prisma.location.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true },
    });

    const usersWithDni = await prisma.user.findMany({
        where: { dni: { not: null } },
        select: { id: true, dni: true },
    });
    const byDni = new Map(usersWithDni.map((u) => [normalizeNif(u.dni!), u.id]));

    let created = 0;
    let updated = 0;
    const detalles: string[] = [];

    for (const emp of plantilla) {
        const nif = normalizeNif(emp.nif);
        const fullName = emp.fullName || [emp.firstName, emp.lastName].filter(Boolean).join(' ');
        const employmentData = {
            position: emp.position ?? null,
            contractType: emp.contractType ?? null,
            startDate: emp.startDate ? new Date(emp.startDate) : null,
            endDate: emp.endDate ? new Date(emp.endDate) : null,
            weeklyHours: emp.weeklyHours ?? null,
            partTime: emp.partTime ?? false,
        };

        let userId = byDni.get(nif) ?? null;
        if (!userId && emp.email) {
            userId = (await prisma.user.findUnique({ where: { email: emp.email }, select: { id: true } }))?.id ?? null;
            if (userId) await prisma.user.update({ where: { id: userId }, data: { dni: nif } });
        }

        if (userId) {
            const employment = await prisma.employment.findFirst({
                where: { userId, isActive: true, empresaId: empresa.id },
                select: { id: true },
            });
            if (employment) {
                await prisma.employment.update({ where: { id: employment.id }, data: employmentData });
            } else {
                const location = matchLocation(locations, emp.workCenter);
                await prisma.employment.create({
                    data: {
                        userId,
                        empresaId: empresa.id,
                        isActive: true,
                        department: 'GENERAL',
                        ...(location ? { assignedLocations: { connect: { id: location.id } } } : {}),
                        ...IMPORT_DEFAULT_PERMS,
                        ...employmentData,
                    },
                });
            }
            updated++;
            detalles.push(`${fullName} (actualizado)`);
        } else {
            const location = matchLocation(locations, emp.workCenter);
            const user = await prisma.user.create({
                data: {
                    // Email placeholder determinista si el ERP no lo tiene: un admin
                    // pondrá el real desde la ficha antes de invitar al empleado.
                    email: emp.email ?? `${nif.toLowerCase()}@pendiente.sotodelprior.local`,
                    password: await bcrypt.hash(crypto.randomUUID(), 10),
                    name: fullName,
                    firstName: emp.firstName || null,
                    lastName: emp.lastName || null,
                    dni: nif,
                    phone: emp.phone || null,
                    jobTitle: emp.position || null,
                    role: 'USER',
                    approved: true,
                },
            });
            byDni.set(nif, user.id);
            await prisma.employment.create({
                data: {
                    userId: user.id,
                    empresaId: empresa.id,
                    isActive: true,
                    department: 'GENERAL',
                    ...(location ? { assignedLocations: { connect: { id: location.id } } } : {}),
                    ...IMPORT_DEFAULT_PERMS,
                    ...employmentData,
                },
            });
            created++;
            detalles.push(`${fullName}${location ? ` → ${location.name}` : ''}`);
        }
    }

    return { created, updated, detalles };
}
