# MVP: Mejora del módulo de tareas con el patrón yurest

**Fecha:** 2026-05-30
**Alcance:** integrar el modelo de checklists de yurest **dentro de la app actual** (`cocina.sotodelprior.com`), sin reemplazar nada de lo que ya funciona. Solo mejoramos el módulo de tareas.

**Referencias:**
- [yurest-analysis.md](yurest-analysis.md) — qué hace yurest y cómo
- [yurest-roadmap-completo-futuro.md](yurest-roadmap-completo-futuro.md) — plan grande de 10 fases (fichaje, vacaciones, horarios, pedidos, etc.) que el cliente puede pedir en el futuro. **Fuera del MVP.**

---

## Decisiones tomadas con el usuario

- **No es una app nueva.** Todo integrado en `cocina.sotodelprior.com`. No `/m/*` separada, no codebase paralela.
- **No tocamos lo que ya funciona:** recetas, eventos, inventario, mise-en-place, obrador, productos, empleados, etc.
- **Tareas de producción + Checklists rutinarios conviven.** Las Task actuales (ligadas a recetas, con `action`/`technique`/`targetQuantity`) siguen existiendo. Se añade el sistema de checklists yurest encima.
- **Vista unificada para el empleado:** las dos cosas se le presentan como "Mis tareas hoy" en una sola lista móvil-friendly. El detalle cambia según el tipo (producción / checklist rutinario), pero la entrada es única.
- **Ubicación en el menú admin:** todo bajo `dashboard/tasks/` con tabs (Tablero actual + Plantillas + Programaciones + Calendario + Informes). No se crea sección nueva.
- **Móvil:** misma app + **PWA instalable** (manifest + service worker).
- **Storage de fotos:** DigitalOcean Spaces (S3-compatible). **Bucket compartido `media-sotodelprior`** entre todas las apps Soto del Prior. Cada app sube bajo su propio prefijo (`cocina/`, `crm/`, `reservas/`). 1 sola suscripción de $5/mes (250 GiB + 1 TB compartidos). Cuando conectes CRM o reservas: crea una Access Key nueva con scope al bucket, configura su `.env.local` con el mismo `DO_SPACES_BUCKET=media-sotodelprior` y un `DO_SPACES_APP_PREFIX` distinto (ej. `crm`).
- **Notificaciones:** in-app únicamente (badge "tienes X tareas pendientes").
- **Multi-tenancy:** la actual (admin `gerencia@sotodelprior.com` = el cliente; locales bajo él). [[deployment-model]].

---

## Arquitectura conceptual

```
  ADMIN (Carlos / Soto del Prior)
  │
  ├── Tasks (modelo existente — producción)
  │   ├── Generadas desde MenuPlanning + eventos
  │   └── Atadas a Recipe + Event + cantidad + técnica
  │
  └── Checklists (modelo nuevo — yurest)
      ├── ChecklistTemplate ── reutilizable
      ├── ChecklistSchedule ── recurrencia + asignación
      ├── ChecklistInstance ── una por día de ejecución
      └── ChecklistResponse ── respuesta a cada campo + foto

  EMPLEADO (María, Juan… en su móvil)
  │
  └── /tasks/today  (vista única, mobile-first)
      ├── Tareas de producción del día (Tasks asignadas)
      └── Checklists del día (ChecklistInstances asignadas)
          → Click en cualquiera → ejecución paso a paso con foto
```

---

## Modelo de datos a añadir

### Nuevos modelos en `apps/web/prisma/schema.prisma`

```prisma
model Location {
  id        String  @id @default(cuid())
  name      String
  shortCode String?
  address   String?
  isActive  Boolean @default(true)
  ownerId   String
  owner     User    @relation("LocationOwner", fields: [ownerId], references: [id])
  employees Employee[] @relation("LocationEmployees")
  schedules ChecklistSchedule[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ChecklistFieldType { TITLE  CHECK  TEXT  YES_NO  RATING_1_10 }
enum PhotoRequirement   { NONE   OPTIONAL  REQUIRED }
enum Frequency          { DAILY  WEEKLY  BIWEEKLY  MONTHLY  QUARTERLY  SEMIANNUAL  ANNUAL }
enum InstanceStatus     { PENDING  IN_PROGRESS  DONE  CLOSED_AUTO  INCIDENT }

model ChecklistTemplate {
  id           String   @id @default(cuid())
  name         String
  description  String?
  locationId   String?  // null = aplicable a todos los locales
  isActive     Boolean  @default(true)
  ownerId      String
  fields       ChecklistField[]
  schedules    ChecklistSchedule[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ChecklistField {
  id               String @id @default(cuid())
  templateId       String
  template         ChecklistTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  order            Int
  type             ChecklistFieldType
  name             String
  description      String?
  exampleImageUrl  String?
  photoRequirement PhotoRequirement @default(NONE)
}

model ChecklistSchedule {
  id                 String   @id @default(cuid())
  templateId         String
  template           ChecklistTemplate @relation(fields: [templateId], references: [id])
  locationId         String
  location           Location @relation(fields: [locationId], references: [id])
  frequency          Frequency
  startDate          DateTime
  endDate            DateTime?
  executionStartTime String   // "08:00"
  executionEndTime   String   // "12:00"
  excludeWeekdays    Int[]    // 0=domingo
  autoClose          Boolean  @default(false)

  performerUserIds   String[]
  supervisorUserIds  String[]

  ownerId            String
  instances          ChecklistInstance[]
}

model ChecklistInstance {
  id             String   @id @default(cuid())
  scheduleId     String
  schedule       ChecklistSchedule @relation(fields: [scheduleId], references: [id])
  dueDate        DateTime
  status         InstanceStatus @default(PENDING)
  openedAt       DateTime?
  closedAt       DateTime?
  closedByUserId String?
  scoreAvg       Float?
  responses      ChecklistResponse[]
  @@unique([scheduleId, dueDate])
}

model ChecklistResponse {
  id              String  @id @default(cuid())
  instanceId      String
  instance        ChecklistInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  fieldId         String
  field           ChecklistField    @relation(fields: [fieldId], references: [id])
  valueText       String?
  valueBool       Boolean?
  valueRating     Int?
  photoUrl        String?
  isIncident      Boolean @default(false)
  incidentNote    String?
  answeredByUserId String?
  answeredAt      DateTime?
}
```

### Cambios en modelos existentes (mínimos)

- `User`: añadir relación `LocationOwner` (locales que posee — solo el admin)
- `Employee`: añadir `locationId String?` (a qué local pertenece)

`Task` (modelo existente, schema.prisma:426) **no se toca**.

---

## Plan en 3 sprints (~3 semanas)

### Sprint 1 — Cimientos + Admin web (semana 1)

**Backend / datos**
- [ ] Crear Space en Digital Ocean (`cocina-sotodelprior-prod`) + Access Key
- [ ] Variables de entorno + dependencia `@aws-sdk/client-s3`
- [ ] Helper `apps/web/lib/storage/spaces.ts` (upload + compresión)
- [ ] API `POST /api/uploads/photo`
- [ ] Migración Prisma con nuevos modelos
- [ ] Seed de locales (SOTO del PRIOR, Montagu) + 6 plantillas reales

**Admin UI bajo `dashboard/tasks/`**
- [ ] Refactor `tasks/page.tsx` a layout con tabs: **Tablero** | **Plantillas** | **Programaciones** | **Calendario** | **Informes**
- [ ] Tab Tablero: lo actual sin tocar
- [ ] Tab Plantillas: listado con filtros (local, estado) + crear/editar plantilla con drag & drop de campos (`@dnd-kit` ya está)
- [ ] Tab Programaciones: listado + wizard de 4 secciones (Información básica, Ejecutores, Supervisores, Avanzadas)
- [ ] Selector de **local activo** en topbar (persiste en cookie, filtra todo)

**Criterios de done Sprint 1**
- Carlos puede crear "Apertura SOTO" con 13 campos
- Carlos puede programarla diaria 8:00-12:00 asignada a María (ejecutora) + Juan (supervisor)
- La instancia para hoy se ha creado en BD (job manual por ahora)
- Subir foto a Spaces desde un endpoint funciona

---

### Sprint 2 — Vista empleado + PWA (semana 2)

**Job de generación**
- [ ] Endpoint `/api/checklists/generate-today` que recorre programaciones y crea instancias del día (idempotente, `@@unique([scheduleId, dueDate])`)
- [ ] Configurar como cron en Digital Ocean o como llamada al primer request del día

**UI empleado (mobile-first)**
- [ ] Página `dashboard/today/page.tsx` — listado del día agrupado por franja horaria:
  - Tareas de producción asignadas a mí
  - Checklists asignados a mí
- [ ] Página detalle checklist `dashboard/today/checklist/[instanceId]/page.tsx` — ejecución paso a paso con foto
- [ ] Componente `<PhotoCapture />` que abre cámara y sube
- [ ] Adaptar detalle de Task existente para que en móvil tenga el mismo aspecto (cantidad real + foto + incidencia)

**PWA**
- [ ] `apps/web/public/manifest.webmanifest`
- [ ] Service worker básico (cache de assets, network-first para API)
- [ ] Iconos PWA (192, 512)
- [ ] Botón "Instalar app" en el dashboard cuando sea instalable

**Criterios de done Sprint 2**
- María abre `cocina.sotodelprior.com` en su móvil, hace login
- Ve "Mis tareas hoy" con 1 producción + 2 checklists
- Ejecuta "Apertura SOTO" paso a paso, hace 3 fotos, envía
- Instala la app en su pantalla de inicio
- Carlos ve la instancia con sus respuestas en el admin

---

### Sprint 3 — Supervisión + Informes + pulido (semana 3)

**Supervisión**
- [ ] Tab "Pendientes de supervisar" en la vista de Juan
- [ ] Marcar instancia como supervisada total/parcial, anotar incidencias

**Informes** bajo tab "Informes" de `dashboard/tasks/`:
- [ ] **Operaciones** — 6 KPIs (Programados, Líneas Supervisadas, Checklists Realizados, Supervisados Totalmente, Valoración Media, Líneas Realizadas)
- [ ] **Cumplimiento** — % por plantilla / local / rango fechas
- [ ] **Incidencias** — galería de respuestas con `isIncident=true`
- [ ] **Respuestas** — log detallado, exportable a Excel

**Pulido**
- [ ] Estados visuales (badge PENDING/IN_PROGRESS/DONE/INCIDENT)
- [ ] Permisos por rol (ejecutor solo ve lo suyo, supervisor ve lo del local, admin ve todo)
- [ ] Notificación in-app: badge "tienes N pendientes" en topbar móvil
- [ ] Auditoría de accesibilidad mínima

**Criterios de done Sprint 3**
- Informe Operaciones funciona con datos reales y se exporta a Excel
- Permisos verificados (María no ve checklists asignados a otros)
- PWA instalable con Lighthouse PWA score > 90

---

## Lo que NO hacemos en este MVP

Está en [yurest-roadmap-completo-futuro.md](yurest-roadmap-completo-futuro.md) para cuando lo pidas:
- Comunicaciones (averías, avisos, eventos, reuniones)
- Fichaje (clock-in)
- Horarios y turnos
- Vacaciones y solicitudes
- Pedidos a proveedores + albaranes firmados
- Etiquetado de productos
- Cierres de caja
- EBITDA / finanzas
- Push notifications web
- Chat con IA

---

## Lo que necesito de ti para arrancar Sprint 1

1. **Space en Digital Ocean** — ¿lo creas tú y me pasas las credenciales (Access Key + Secret + Endpoint + Region), o te guío para crearlo?
2. **Locales** — confirmas SOTO del PRIOR + Montagu, ¿algún otro?
3. **Empleados existentes** — los actuales en BD, ¿a qué local pertenecen? ¿O dejamos `locationId = null` por ahora y se asigna luego?
4. **Job de generación** — el endpoint `/api/checklists/generate-today` se puede llamar:
   - (a) Cron de Digital Ocean App Platform (si está en App Platform)
   - (b) Llamada lazy al primer request del día
   - (c) Servicio externo (cron-job.org gratis)

   ¿Cuál prefieres? Si no sabes, voy con **(b) lazy** que no requiere infra extra.
