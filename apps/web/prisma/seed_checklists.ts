// Seed inicial de Locales + Plantillas de Checklist (estilo yurest).
// Idempotente: ejecutable múltiples veces sin duplicar.
// Run: npx tsx prisma/seed_checklists.ts

import { PrismaClient, ChecklistFieldType, PhotoRequirement } from "@prisma/client";

const prisma = new PrismaClient();

type FieldSeed = {
  name: string;
  type: ChecklistFieldType;
  description?: string;
  photoRequirement?: PhotoRequirement;
};

type TemplateSeed = {
  name: string;
  description?: string;
  locationShortCode?: string; // null = todos los locales
  fields: FieldSeed[];
};

const LOCATIONS = [
  { name: "SOTO del PRIOR Pamplona", shortCode: "SOTO" },
  { name: "Montagu Pamplona", shortCode: "MGU" },
];

const TEMPLATES: TemplateSeed[] = [
  {
    name: "Apertura",
    description: "Tareas de apertura del local",
    locationShortCode: "SOTO",
    fields: [
      { name: "Encender lavavajillas", type: "CHECK", description: "Encender los lavavajillas de la barra" },
      { name: "Poner Música en Spotify", type: "CHECK", description: "Poner la lista SOTO del PRIOR" },
      { name: "Encender aire acondicionado", type: "YES_NO", description: "Si procede encender, siempre deberá estar a 24°", photoRequirement: "OPTIONAL" },
      { name: "WhatsApp y Llamadas", type: "CHECK", description: "Atender WhatsApp y llamadas pendientes" },
      { name: "Poner letrero calle", type: "CHECK", description: "El letrero que se os olvida siempre", photoRequirement: "OPTIONAL" },
      { name: "Reservas", type: "CHECK", description: "Confirmar reservas en Covermanager" },
      { name: "Encender cafetera", type: "CHECK" },
      { name: "Revisar caja", type: "TEXT", description: "Apuntar saldo inicial" },
      { name: "Limpieza barra", type: "CHECK", description: "Pasar bayeta y desinfectante", photoRequirement: "OPTIONAL" },
      { name: "Encender luces sala", type: "CHECK" },
      { name: "Comprobar reservas web", type: "CHECK" },
      { name: "Montar mesas terraza", type: "CHECK", photoRequirement: "OPTIONAL" },
      { name: "Valoración estado local", type: "RATING_1_10", description: "1 = malo · 10 = perfecto" },
    ],
  },
  {
    name: "Cierre",
    description: "Tareas de cierre del local",
    locationShortCode: "SOTO",
    fields: [
      { name: "Apagar cafetera", type: "CHECK" },
      { name: "Limpiar máquinas", type: "CHECK", photoRequirement: "REQUIRED" },
      { name: "Cierre de caja", type: "TEXT", description: "Apuntar saldo final" },
      { name: "Revisar cámaras frigoríficas", type: "YES_NO", description: "¿Temperatura correcta?", photoRequirement: "OPTIONAL" },
      { name: "Apagar lavavajillas", type: "CHECK" },
      { name: "Sacar basura", type: "CHECK" },
      { name: "Limpiar suelo cocina", type: "CHECK", photoRequirement: "OPTIONAL" },
      { name: "Limpiar suelo sala", type: "CHECK" },
      { name: "Cerrar persianas", type: "CHECK" },
      { name: "Apagar luces", type: "CHECK" },
      { name: "Activar alarma", type: "CHECK" },
      { name: "Cerrar puerta principal", type: "CHECK" },
      { name: "Apuntar incidencias del turno", type: "TEXT" },
      { name: "Valoración estado local al cerrar", type: "RATING_1_10" },
      { name: "Foto general del local cerrado", type: "TITLE", photoRequirement: "REQUIRED" },
    ],
  },
  {
    name: "Apertura",
    description: "Tareas de apertura del local",
    locationShortCode: "MGU",
    fields: [
      { name: "Encender cafetera", type: "CHECK" },
      { name: "Encender lavavajillas", type: "CHECK" },
      { name: "Poner música", type: "CHECK", description: "Lista Montagu" },
      { name: "Encender aire acondicionado", type: "YES_NO" },
      { name: "Revisar reservas", type: "CHECK" },
      { name: "Revisar caja", type: "TEXT", description: "Saldo inicial" },
      { name: "Limpiar barra", type: "CHECK", photoRequirement: "OPTIONAL" },
      { name: "Montar terraza", type: "CHECK", photoRequirement: "OPTIONAL" },
      { name: "Encender luces", type: "CHECK" },
      { name: "Valoración estado local", type: "RATING_1_10" },
    ],
  },
  {
    name: "Cierre",
    description: "Tareas de cierre del local",
    locationShortCode: "MGU",
    fields: [
      { name: "Apagar cafetera", type: "CHECK" },
      { name: "Limpiar máquinas", type: "CHECK", photoRequirement: "REQUIRED" },
      { name: "Cierre de caja", type: "TEXT" },
      { name: "Revisar cámaras", type: "YES_NO" },
      { name: "Sacar basura", type: "CHECK" },
      { name: "Limpiar suelos", type: "CHECK" },
      { name: "Cerrar persianas", type: "CHECK" },
      { name: "Activar alarma", type: "CHECK" },
      { name: "Apuntar incidencias", type: "TEXT" },
    ],
  },
  {
    name: "MEP cocina",
    description: "Mise en place de cocina",
    locationShortCode: "SOTO",
    fields: [
      { name: "Sacar mise en place fríos", type: "CHECK", photoRequirement: "OPTIONAL" },
      { name: "Sacar mise en place calientes", type: "CHECK", photoRequirement: "OPTIONAL" },
      { name: "Cortar verduras", type: "CHECK" },
      { name: "Preparar salsas base", type: "CHECK" },
      { name: "Revisar carnes en cámara", type: "YES_NO" },
      { name: "Marinar carnes del servicio", type: "CHECK" },
      { name: "Hornear pan", type: "CHECK", photoRequirement: "OPTIONAL" },
      { name: "Limpiar zona de trabajo", type: "CHECK", photoRequirement: "REQUIRED" },
      { name: "Apuntar productos a reponer", type: "TEXT" },
    ],
  },
  {
    name: "Limpieza cocina",
    description: "Limpieza profunda de cocina",
    locationShortCode: "SOTO",
    fields: [
      { name: "Desengrasar campana", type: "CHECK", photoRequirement: "REQUIRED" },
      { name: "Limpiar plancha", type: "CHECK", photoRequirement: "REQUIRED" },
      { name: "Limpiar fogones", type: "CHECK", photoRequirement: "REQUIRED" },
      { name: "Limpiar horno", type: "CHECK" },
      { name: "Limpiar nevera de servicio", type: "CHECK" },
      { name: "Fregar suelo cocina", type: "CHECK" },
      { name: "Vaciar y limpiar freidora", type: "YES_NO", description: "Si toca cambio de aceite" },
      { name: "Tirar productos caducados", type: "TEXT", description: "Apuntar qué se ha tirado" },
      { name: "Valoración estado de limpieza", type: "RATING_1_10" },
    ],
  },
  {
    name: "Limpieza sala",
    description: "Limpieza de sala / barra / aseos",
    locationShortCode: "SOTO",
    fields: [
      { name: "Limpiar mesas", type: "CHECK" },
      { name: "Limpiar sillas y bancos", type: "CHECK" },
      { name: "Limpiar barra", type: "CHECK", photoRequirement: "OPTIONAL" },
      { name: "Limpiar aseos", type: "CHECK", photoRequirement: "REQUIRED" },
      { name: "Reponer papel y jabón", type: "CHECK" },
      { name: "Fregar suelo sala", type: "CHECK" },
      { name: "Limpiar ventanas y cristales", type: "CHECK" },
      { name: "Vaciar papeleras", type: "CHECK" },
      { name: "Valoración estado sala", type: "RATING_1_10" },
    ],
  },
];

async function main() {
  console.log("Seed checklists starting...");
  const admin = await prisma.user.findUnique({
    where: { email: "gerencia@sotodelprior.com" },
  });
  if (!admin) {
    throw new Error("Admin gerencia@sotodelprior.com no encontrado. Ejecuta primero `seed.ts`.");
  }

  // 1) Seed Locations
  const locationByCode = new Map<string, string>();
  for (const loc of LOCATIONS) {
    const existing = await prisma.location.findFirst({
      where: { ownerId: admin.id, name: loc.name },
    });
    if (existing) {
      console.log(`  · Location ya existe: ${loc.name}`);
      locationByCode.set(loc.shortCode, existing.id);
      continue;
    }
    const created = await prisma.location.create({
      data: { name: loc.name, shortCode: loc.shortCode, ownerId: admin.id },
    });
    console.log(`  ✓ Location creado: ${loc.name}`);
    locationByCode.set(loc.shortCode, created.id);
  }

  // 2) Seed Templates + Fields
  for (const tpl of TEMPLATES) {
    const locationId = tpl.locationShortCode ? locationByCode.get(tpl.locationShortCode) : null;
    const existing = await prisma.checklistTemplate.findFirst({
      where: { ownerId: admin.id, name: tpl.name, locationId: locationId ?? null },
    });
    if (existing) {
      console.log(`  · Template ya existe: ${tpl.name} (${tpl.locationShortCode ?? "GLOBAL"})`);
      continue;
    }
    await prisma.checklistTemplate.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        ownerId: admin.id,
        locationId: locationId ?? null,
        fields: {
          create: tpl.fields.map((f, idx) => ({
            order: idx,
            type: f.type,
            name: f.name,
            description: f.description,
            photoRequirement: f.photoRequirement ?? "NONE",
          })),
        },
      },
    });
    console.log(`  ✓ Template creado: ${tpl.name} (${tpl.locationShortCode ?? "GLOBAL"}) con ${tpl.fields.length} campos`);
  }

  console.log("Seed checklists OK ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
