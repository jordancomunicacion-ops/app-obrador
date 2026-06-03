import { PrismaClient } from '@prisma/client';

/**
 * Crea un Business por cada User ADMIN existente, reutilizando su id.
 *
 * Truco: como los 28 modelos legacy tienen `ownerId` apuntando al User.id del
 * ADMIN, si el Business.id coincide con ese User.id, las queries actuales
 * siguen funcionando (las relaciones quedan implícitamente vinculadas al
 * Business). En Fase 2 renombraremos `ownerId` → `businessId` con FK formal.
 *
 * Idempotente: si ya existe un Business con ese id, no se duplica.
 * Si no hay ADMINs (p. ej. en producción tras la migración a SUPERADMIN),
 * el script termina sin hacer nada — los Business se crearán manualmente
 * desde /dashboard/settings/empresas.
 */

const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true },
    });

    if (admins.length === 0) {
        console.log('No hay usuarios ADMIN; nada que sembrar.');
        return;
    }

    let created = 0;
    let existed = 0;
    for (const admin of admins) {
        const existing = await prisma.business.findUnique({ where: { id: admin.id } });
        if (existing) {
            existed += 1;
            console.log(`  Business ya existe para ${admin.email} (id=${admin.id})`);
            continue;
        }
        const business = await prisma.business.create({
            data: {
                id: admin.id, // Reutilizamos el id del User ADMIN para no romper FK legacy
                name: admin.name || admin.email,
            },
        });

        // Le damos acceso completo a su propio email (es el dueño).
        await prisma.businessAccess.upsert({
            where: { email_businessId: { email: admin.email.toLowerCase(), businessId: business.id } },
            create: {
                email: admin.email.toLowerCase(),
                businessId: business.id,
                canViewEmployees: true,
                canManageDirectory: true,
                canEditSettings: true,
            },
            update: {
                canViewEmployees: true,
                canManageDirectory: true,
                canEditSettings: true,
            },
        });

        console.log(`  Business CREADO para ${admin.email} (id=${admin.id})`);
        created += 1;
    }

    console.log(`\nResumen: ${created} creados, ${existed} ya existían.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
