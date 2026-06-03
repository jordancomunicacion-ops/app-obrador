/**
 * Seed de demostración del aislamiento por local (Fase 1).
 *
 * Crea una jerarquía mínima para probar el scoping:
 *   - 1 propietario de plataforma (SUPERADMIN) → debe ver TODO.
 *   - 1 cuenta de cliente (ADMIN / tenant).
 *   - 1 Empresa (empleador legal) de ese cliente.
 *   - 2 Locales (centros de trabajo) de esa empresa.
 *   - 1 empleado con contrato (Employment) en la empresa, asignado al Local A.
 *   - 1 receta en cada local, para verificar que cada local ve solo la suya.
 *
 * Idempotente: usa upsert por email/clave única. Ejecutar con:
 *   npx ts-node scripts/seed-isolation-demo.ts
 *
 * NO crea datos en producción salvo que se ejecute explícitamente.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo1234';

async function main() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Propietario de plataforma (ve todo, cross-tenant).
  const platform = await prisma.user.upsert({
    where: { email: 'gerencia@sotodelprior.com' },
    update: { role: 'SUPERADMIN', approved: true },
    create: {
      name: 'Gerencia (Plataforma)',
      email: 'gerencia@sotodelprior.com',
      password,
      role: 'SUPERADMIN',
      approved: true,
      permissions: ['dashboard', 'recipes', 'products', 'events', 'tasks', 'settings'],
    },
  });

  // 2. Cuenta de cliente (tenant / ADMIN).
  const client = await prisma.user.upsert({
    where: { email: 'cliente.demo@sotodelprior.com' },
    update: { role: 'ADMIN', approved: true },
    create: {
      name: 'Cliente Demo',
      email: 'cliente.demo@sotodelprior.com',
      password,
      role: 'ADMIN',
      approved: true,
      permissions: ['dashboard', 'recipes', 'products', 'events', 'tasks', 'settings'],
    },
  });

  // 3. Empresa (empleador legal) del cliente.
  let empresa = await prisma.empresa.findFirst({ where: { businessId: client.id, nif: 'B00000001' } });
  if (!empresa) {
    empresa = await prisma.empresa.create({
      data: {
        razonSocial: 'Restauración Demo S.L.',
        comercialName: 'Demo',
        nif: 'B00000001',
        businessId: client.id,
      },
    });
  }

  // 4. Dos locales (centros de trabajo) de la empresa.
  async function ensureLocation(name: string, shortCode: string) {
    const existing = await prisma.location.findFirst({ where: { businessId: client.id, name } });
    if (existing) return existing;
    return prisma.location.create({
      data: { name, shortCode, businessId: client.id, empresaId: empresa!.id },
    });
  }
  const locA = await ensureLocation('Local A — Centro', 'A');
  const locB = await ensureLocation('Local B — Playa', 'B');

  // 5. Empleado con contrato en la empresa, asignado al Local A.
  const worker = await prisma.user.upsert({
    where: { email: 'empleado.demo@sotodelprior.com' },
    update: { role: 'USER', approved: true, adminId: client.id, locationId: locA.id },
    create: {
      name: 'Empleado Demo',
      email: 'empleado.demo@sotodelprior.com',
      password,
      role: 'USER',
      approved: true,
      adminId: client.id,
      locationId: locA.id,
      permissions: ['dashboard', 'recipes'],
    },
  });

  const employment = await prisma.employment.findFirst({ where: { userId: worker.id, empresaId: empresa.id } });
  if (!employment) {
    await prisma.employment.create({
      data: {
        userId: worker.id,
        empresaId: empresa.id,
        position: 'Cocinero',
        contractType: 'INDEFINIDO',
        startDate: new Date(),
        assignedLocations: { connect: [{ id: locA.id }] },
      },
    });
  }

  // 6. Una receta en cada local, para verificar el aislamiento.
  async function ensureRecipe(name: string, locationId: string) {
    const existing = await prisma.recipe.findFirst({ where: { name, locationId } });
    if (existing) return existing;
    return prisma.recipe.create({
      data: { name, yieldQuantity: 1, category: 'ELABORACION_FINAL', businessId: client.id, locationId },
    });
  }
  await ensureRecipe('Receta de prueba — Local A', locA.id);
  await ensureRecipe('Receta de prueba — Local B', locB.id);

  console.log('\n✅ Seed de aislamiento creado.\n');
  console.log('Credenciales (contraseña para todos: ' + DEMO_PASSWORD + '):');
  console.table([
    { rol: 'Plataforma (ve todo)', email: platform.email },
    { rol: 'Cliente (ADMIN)', email: client.email },
    { rol: 'Empleado (Local A)', email: worker.email },
  ]);
  console.log('\nLocales:', locA.name, '/', locB.name);
  console.log('Prueba: el empleado/cliente en "Local A" debe ver solo "Receta de prueba — Local A";');
  console.log('al cambiar a "Local B", solo la de B; el propietario de plataforma debe ver ambas.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
