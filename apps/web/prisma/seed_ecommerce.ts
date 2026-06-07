/**
 * Seed de productos vendibles online para el local SOTO del PRIOR.
 *
 * Idempotente: busca cada producto por (nombre + local) y lo crea si no existe,
 * o actualiza solo sus campos de venta online si ya existe. NO toca productos de
 * otros locales. Pensado para arrancar el catálogo de la tienda; la ficha legal
 * completa (alérgenos, denominación, nutrición) se rellena luego en la UI.
 *
 * Uso:
 *   npx tsx prisma/seed_ecommerce.ts
 * (con DATABASE_URL apuntando a la BD correcta)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nombre del local destino. Ajusta si cambia.
const LOCATION_NAME = 'SOTO del PRIOR Pamplona';

type SeedProduct = {
  name: string;
  category: string; // EXPERIENCIA | EMBUTIDO | PACK_CARNE | LICOR
  salePrice: number;
  onlineDescription: string;
};

// Productos iniciales (los 3 que mostraba la web). Añade aquí licores y packs
// de carne con sus nombres y precios reales.
const PRODUCTS: SeedProduct[] = [
  {
    name: 'Menú Degustación',
    category: 'EXPERIENCIA',
    salePrice: 70,
    onlineDescription: 'Menú degustación de 6 pases. Una experiencia gastronómica completa.',
  },
  {
    name: 'Visita a la Granja',
    category: 'EXPERIENCIA',
    salePrice: 20,
    onlineDescription: 'Experiencia guiada por nuestra ganadería. El origen de todo.',
  },
  {
    name: 'Pack Artesanal',
    category: 'EMBUTIDO',
    salePrice: 50,
    onlineDescription: 'Selección de chorizo, salchichón y cecina de elaboración propia.',
  },
  // --- Pendientes de datos reales (descomentar y completar precio/descripción) ---
  // { name: 'Pack hamburguesas de buey', category: 'PACK_CARNE', salePrice: 0, onlineDescription: '' },
  // { name: 'Pack chuletas',              category: 'PACK_CARNE', salePrice: 0, onlineDescription: '' },
  // { name: 'Pack salchichas de pellizco',category: 'PACK_CARNE', salePrice: 0, onlineDescription: '' },
  // { name: '<Licor 1>',                  category: 'LICOR',      salePrice: 0, onlineDescription: '' },
];

async function main() {
  const location = await prisma.location.findFirst({
    where: { name: LOCATION_NAME },
    select: { id: true, businessId: true },
  });
  if (!location) {
    throw new Error(`Local "${LOCATION_NAME}" no encontrado. Revisa LOCATION_NAME.`);
  }
  console.log(`Local destino: ${LOCATION_NAME} (${location.id})`);

  for (const p of PRODUCTS) {
    const existing = await prisma.masterProduct.findFirst({
      where: { name: p.name, locationId: location.id },
      select: { id: true },
    });

    if (existing) {
      await prisma.masterProduct.update({
        where: { id: existing.id },
        data: {
          category: p.category,
          isSellableOnline: true,
          salePrice: p.salePrice,
          onlineDescription: p.onlineDescription,
        },
      });
      console.log(`  ↻ actualizado: ${p.name} (${p.salePrice} €)`);
    } else {
      await prisma.masterProduct.create({
        data: {
          name: p.name,
          category: p.category,
          isObrador: true,
          isSellableOnline: true,
          salePrice: p.salePrice,
          onlineDescription: p.onlineDescription,
          locationId: location.id,
        },
      });
      console.log(`  ✚ creado: ${p.name} (${p.salePrice} €)`);
    }
  }

  console.log('Seed ecommerce completado.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
