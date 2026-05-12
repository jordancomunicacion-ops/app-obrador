import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Obrador Seed starting...');
  try {
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!user) {
      console.log('No admin user found. Please run main seed first.');
      return;
    }

    // 1. Create Obrador Config
    await prisma.obradorConfig.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        businessName: 'SOTOdelPRIOR Gourmet',
        companyName: 'Soto del Prior SL',
        nif: 'B12345678',
        address: 'Calle Mayor 1, 28001 Madrid',
        phone: '910000000',
        email: 'obrador@sotodelprior.com',
        activity: 'obrador',
        registryType: 'rgseaa',
        registryNumber: '26.0000000/M',
        region: 'Madrid',
        status: 'aprobado',
        ownerId: user.id
      }
    });

    // 2. Create Products
    const products = [
      {
        name: 'Carne picada de ternera',
        category: 'carne picada',
        legalDenomination: 'Preparado de carne picada de vacuno',
        conservationType: 'refrigerado',
        recommendedTemp: '0ºC a 4ºC',
        shelfLifeDays: 2,
        requiresCooking: true,
        usageInstructions: 'Cocinar completamente antes de consumir',
        saleFormat: 'bandeja',
        defaultWeight: 0.5,
        ownerId: user.id
      },
      {
        name: 'Chuletas de cerdo',
        category: 'carne fresca',
        legalDenomination: 'Chuletas de cerdo blanco',
        conservationType: 'refrigerado',
        recommendedTemp: '0ºC a 4ºC',
        shelfLifeDays: 3,
        requiresCooking: true,
        usageInstructions: 'Cocinar completamente antes de consumir',
        saleFormat: 'bandeja',
        defaultWeight: 1.0,
        ownerId: user.id
      },
      {
        name: 'Pan casero de hamburguesa',
        category: 'pan',
        legalDenomination: 'Pan especial tipo brioche',
        conservationType: 'ambiente',
        recommendedTemp: 'Lugar fresco y seco',
        shelfLifeDays: 3,
        requiresCooking: false,
        usageInstructions: 'Listo para consumir. Se recomienda tostar.',
        saleFormat: 'bolsa',
        defaultWeight: 0.2,
        ownerId: user.id
      },
      {
        name: 'Chorizo fresco',
        category: 'embutido',
        legalDenomination: 'Embutido crudo curado',
        conservationType: 'refrigerado',
        recommendedTemp: '0ºC a 4ºC',
        shelfLifeDays: 5,
        requiresCooking: true,
        usageInstructions: 'Cocinar antes de consumir',
        saleFormat: 'vacío',
        defaultWeight: 0.3,
        ownerId: user.id
      }
    ];

    for (const p of products) {
      await prisma.obradorProduct.create({
        data: p
      });
      console.log(`Created Product: ${p.name}`);
    }

    // 3. Create Cleaning Tasks
    const cleaningTasks = [
      { area: 'Obrador', task: 'Limpieza de mesas de trabajo', frequency: 'Diaria', ownerId: user.id },
      { area: 'Obrador', task: 'Desinfección de suelos', frequency: 'Diaria', ownerId: user.id },
      { area: 'Cámara 1', task: 'Limpieza profunda de estanterías', frequency: 'Semanal', ownerId: user.id }
    ];

    for (const t of cleaningTasks) {
      await prisma.obradorCleaningTask.create({ data: t });
    }

    console.log('Obrador Seed finished successfully.');
  } catch (e) {
    console.error('Obrador Seed Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
