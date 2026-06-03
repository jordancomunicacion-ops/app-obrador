import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Migración: separar PLATAFORMA de TENANT.
 *
 * Hoy gerencia@sotodelprior.com es ADMIN y dueña de los datos del obrador
 * (locales, empleados, tareas, recetas… 28 modelos con ownerId). Queremos que
 * gerencia sea SUPERADMIN (propietario de plataforma, cross-tenant) y que los
 * datos pertenezcan a una CUENTA DE NEGOCIO (tenant ADMIN) independiente.
 *
 * Pasos (en una transacción):
 *  1. Crea (o reutiliza) la cuenta tenant "Soto del Prior (Obrador)".
 *  2. Reasigna todos los `ownerId` de gerencia → tenant en los 28 modelos.
 *  3. Reasigna `adminId` de los empleados de gerencia → tenant.
 *  4. Promueve gerencia a SUPERADMIN.
 *
 * Idempotente: si se vuelve a ejecutar, no hay filas con ownerId/adminId de
 * gerencia y solo confirma el rol SUPERADMIN.
 *
 * Config por entorno (con valores por defecto):
 *  - PLATFORM_EMAIL       (def: gerencia@sotodelprior.com)
 *  - TENANT_EMAIL         (def: obrador@sotodelprior.com)
 *  - TENANT_PASSWORD      (def: Obrador2026! — CÁMBIALA luego)
 *  - TENANT_NAME          (def: Soto del Prior (Obrador))
 */

const prisma = new PrismaClient();

const PLATFORM_EMAIL = process.env.PLATFORM_EMAIL ?? 'gerencia@sotodelprior.com';
const TENANT_EMAIL = process.env.TENANT_EMAIL ?? 'obrador@sotodelprior.com';
const TENANT_PASSWORD = process.env.TENANT_PASSWORD ?? 'Obrador2026!';
const TENANT_NAME = process.env.TENANT_NAME ?? 'Soto del Prior (Obrador)';

// Accesores del Prisma Client (camelCase) de los 28 modelos con `ownerId`.
const OWNER_MODELS = [
    'appConfig', 'ingredient', 'customer', 'supplier', 'recipe', 'event', 'task',
    'productionRoutine', 'storageLocation', 'miseEnPlaceTask', 'menuService',
    'obradorConfig', 'obradorRawMaterialEntry', 'obradorProductionBatch',
    'obradorTemperatureLog', 'obradorIncident', 'obradorSanitaryDocument',
    'empresa', 'location', 'checklistTemplate', 'checklistSchedule', 'communication',
    'taskDefinition', 'taskSchedule', 'taskInstance', 'purchaseOrder', 'productLabel',
    'integrationApiKey',
] as const;

// Tabla Postgres de un modelo: sin @@map, es el PascalCase del accesor.
const tableOf = (model: string) => model.charAt(0).toUpperCase() + model.slice(1);

async function main() {
    const gerencia = await prisma.user.findUnique({ where: { email: PLATFORM_EMAIL } });
    if (!gerencia) {
        console.error(`ERROR: no existe el usuario plataforma ${PLATFORM_EMAIL}. Abortando.`);
        return;
    }
    const OLD = gerencia.id;
    console.log(`Plataforma: ${PLATFORM_EMAIL} (id=${OLD}, role=${gerencia.role})`);

    // Toleramos drift de esquema: solo migramos modelos cuya tabla exista en la BD.
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `;
    const existing = new Set(rows.map((r) => r.table_name));
    const models = OWNER_MODELS.filter((m) => existing.has(tableOf(m)));
    const skipped = OWNER_MODELS.filter((m) => !existing.has(tableOf(m)));
    if (skipped.length > 0) {
        console.log(`\nAviso: tablas ausentes (se omiten): ${skipped.map(tableOf).join(', ')}`);
    }

    await prisma.$transaction(async (tx) => {
        const txDb = tx as any;

        // 1. Cuenta tenant (find-or-create).
        let tenant = await tx.user.findUnique({ where: { email: TENANT_EMAIL } });
        if (!tenant) {
            const hashed = await bcrypt.hash(TENANT_PASSWORD, 10);
            tenant = await tx.user.create({
                data: {
                    name: TENANT_NAME,
                    email: TENANT_EMAIL,
                    password: hashed,
                    role: 'ADMIN',
                    approved: true,
                    adminId: null,
                    permissions: gerencia.permissions,
                },
            });
            console.log(`Tenant CREADO: ${TENANT_NAME} <${TENANT_EMAIL}> (id=${tenant.id})`);
            console.log(`  >>> Contraseña inicial: ${TENANT_PASSWORD}  (cámbiala tras entrar)`);
        } else {
            console.log(`Tenant YA EXISTE: ${TENANT_EMAIL} (id=${tenant.id}) — se reutiliza.`);
        }
        const NEW = tenant.id;

        if (NEW === OLD) {
            console.log('El tenant y la plataforma son el mismo usuario. Nada que migrar.');
            return;
        }

        // 2. Reasignar ownerId OLD → NEW en cada modelo.
        console.log('\n=== Reasignando ownerId ===');
        let totalOwner = 0;
        for (const model of models) {
            const res = await txDb[model].updateMany({
                where: { ownerId: OLD },
                data: { ownerId: NEW },
            });
            if (res.count > 0) console.log(`  ${model}: ${res.count}`);
            totalOwner += res.count;
        }
        console.log(`  TOTAL filas con ownerId reasignadas: ${totalOwner}`);

        // 3. Reasignar empleados (adminId) OLD → NEW. (No toca a gerencia: su adminId es null.)
        const emp = await tx.user.updateMany({
            where: { adminId: OLD },
            data: { adminId: NEW },
        });
        console.log(`\n=== Empleados reasignados (adminId): ${emp.count} ===`);

        // 4. Gerencia → SUPERADMIN.
        await tx.user.update({
            where: { id: OLD },
            data: { role: 'SUPERADMIN', adminId: null },
        });
        console.log('\n=== gerencia → SUPERADMIN ✔ ===');
    }, { timeout: 60_000 });

    console.log('\nMIGRACIÓN COMPLETADA.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
