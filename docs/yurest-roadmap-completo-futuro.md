# Roadmap de implementación — clonar yurest en la app cocina

**Fecha:** 2026-05-29
**Punto de partida:** [docs/yurest-analysis.md](yurest-analysis.md) (mapa de yurest) + auditoría de `apps/web/` (Next.js 16 + React 19 + Prisma 5 + NextAuth 5 + PostgreSQL + Tailwind 4)
**Decisiones tomadas con el usuario:**
- **Modelo de despliegue:** 1 instancia por cliente (igual que `crm.sotodelprior.com` y `reservas.sotodelprior.com`). Esta instancia (`obrador.sotodelprior.com`) sirve a Soto del Prior. Si en el futuro vendemos la app a otro cliente, se despliega otra instancia + subdominio + base de datos propia.
- **Multi-tenancy:** NO necesaria. El "admin" del schema actual = el cliente. Solo añadimos modelo `Location` por debajo para separar los locales del cliente (SOTO del PRIOR + Montagu)
- **Infraestructura:** Digital Ocean (droplet + managed Postgres + Spaces)
- **Almacenamiento de fotos:** **DigitalOcean Spaces** (API S3-compatible, mismo proveedor que el resto)
- **Notificaciones Fase 1:** solo in-app (web push se deja para Fase 10)
- **Móvil:** PWA web instalable (sin Capacitor)
- **Alcance:** roadmap completo por fases, MVP iterativo. Refactorizamos si hace falta más adelante.

---

## Resumen del enfoque

Aprovechamos al máximo lo que ya tiene la app. **No reescribir** lo que funciona — sí perfeccionar las dinámicas de tarea siguiendo el patrón yurest y añadir los módulos que faltan.

Lo que ya existe y se reutiliza:
- Auth + scoping admin/workers vía `ownerId` ([auth.ts:91](apps/web/auth.ts:91) `currentOrgId()`)
- `User`, `Employee`, roles ADMIN/USER/VET
- `Recipe`, `RecipeCategory`, `RecipePackaging`, `Event`, `MenuService`
- `Ingredient`, `MasterProduct`, `SupplierProduct`, `StorageLocation`
- Tablero Kanban de tareas (lo reemplazamos / convivimos)
- Stack moderno: Next.js 16, React 19, Tailwind 4, dnd-kit

Lo que añadimos:
- `Location` (multi-local bajo cada admin)
- PWA + layout móvil `/m/*` con bottom tab navigation
- Cloudflare R2 + helpers de subida de fotos
- Sistema completo de checklists tipo yurest
- Comunicaciones, fichaje, horarios, vacaciones, pedidos, etiquetado, cajas, EBITDA

---

## Fase 0 — Cimientos (1 semana)

Prerrequisitos compartidos por TODAS las fases siguientes. Hay que hacerlo bien una vez.

### F0.1 — Modelo Location

Schema Prisma:
```
model Location {
  id        String  @id @default(cuid())
  name      String  // "SOTO del PRIOR", "Montagu Pamplona"
  shortCode String? // "SOTO", "MGU"
  address   String?
  isActive  Boolean @default(true)

  ownerId String   // el admin propietario
  owner   User     @relation("LocationOwner", fields: [ownerId], references: [id])

  employees Employee[]  @relation("LocationEmployees")
  // (más adelante) ChecklistSchedule[], ClockIn[], CashClosing[], ...

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Cambios en modelos existentes (mínimos):
- `Employee` añade `locationId String?` (puede pertenecer a 1 local; multi-local en F8 si hace falta)
- `Event`, `MenuService`, `Recipe` se quedan a nivel admin (ownerId) — no se asocian a local salvo que el usuario lo pida

Cambios de UX:
- Selector de **local activo** en topbar (igual que yurest), guarda preferencia en cookie. Filtra todo el contenido siguiente.
- Página `dashboard/settings/locations` para CRUD de locales

Migración + seed: crear "SOTO del PRIOR" y "Montagu Pamplona" para Jordazola.

### F0.2 — DigitalOcean Spaces + helper de uploads

- Crear Space en Digital Ocean: `cocina-sotodelprior-prod` (+ `-dev` si quieres separar)
- Generar Access Key + Secret en DO (sección "Spaces Keys")
- Variables de entorno en `.env`: `DO_SPACES_REGION` (ej. `fra1`), `DO_SPACES_ENDPOINT`, `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_BUCKET`, `DO_SPACES_PUBLIC_URL`
- Dependencia: `@aws-sdk/client-s3` (Spaces es S3-compatible, mismo SDK)
- Helper `apps/web/lib/storage/spaces.ts` con `uploadPhoto(file, prefix)` que devuelve URL pública
- API route `POST /api/uploads/photo` que recibe multipart, comprime a 1280px, sube y devuelve `{ url, key }`
- Componente React `<PhotoCapture />` que abre cámara (`capture="environment"`) y previsualiza antes de subir
- CDN automático: Spaces incluye CDN gratis — usar URL CDN para servir fotos

### F0.3 — PWA + layout móvil

- `apps/web/public/manifest.webmanifest` con icons, theme color, display=standalone, start_url=`/m`
- `next.config.ts` con `next-pwa` (o configuración manual de service worker con Workbox)
- Service worker básico: cache de assets + estrategia network-first para API
- Layout `apps/web/app/m/layout.tsx` con bottom tab navigation (Hoy · Mis tareas · Avisos · Yo)
- Detección de install prompt + botón "Instalar app"

### F0.4 — Permisos y roles refinados

Definir constantes `PERMISSIONS` y helper `can(user, perm, scope?)`:
- `checklist.template.manage`
- `checklist.schedule.manage`
- `checklist.execute` (los empleados ejecutan)
- `checklist.supervise`
- `location.manage`
- (más se irán añadiendo por fase)

Helper único en `apps/web/lib/auth/permissions.ts` reemplaza checks ad-hoc actuales.

### Criterios de done F0
- [ ] Migración aplicada, locales seedeados
- [ ] Selector de local funciona en topbar y persiste
- [ ] Subir una foto desde el navegador móvil con la cámara → llega a R2 y devuelve URL
- [ ] La app es instalable como PWA en Chrome Android e iOS Safari
- [ ] `/m/login` redirige a `/m/today` (placeholder) tras login

**Esfuerzo estimado: 1 semana**

---

## Fase 1 — Checklists (3 semanas) ⭐ EL CORAZÓN

Réplica funcional del módulo yurest. Lo que mejora vs nuestras `Task` actuales: respuesta detallada campo a campo, foto obligatoria/opcional, programación con frecuencia, supervisión.

### F1.1 — Modelo de datos

```
model ChecklistTemplate {
  id           String   @id @default(cuid())
  name         String
  description  String?
  locationId   String?  // si null → aplicable a todos los locales del admin
  departmentId String?
  zoneId       String?
  isActive     Boolean  @default(true)
  ownerId      String
  fields       ChecklistField[]
  schedules    ChecklistSchedule[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum ChecklistFieldType { TITLE  CHECK  TEXT  YES_NO  RATING_1_10 }
enum PhotoRequirement   { NONE   OPTIONAL  REQUIRED }

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

enum Frequency { DAILY WEEKLY BIWEEKLY MONTHLY QUARTERLY SEMIANNUAL ANNUAL }

model ChecklistSchedule {
  id                 String   @id @default(cuid())
  templateId         String
  template           ChecklistTemplate @relation(fields: [templateId], references: [id])
  locationId         String
  location           Location @relation(fields: [locationId], references: [id])
  departmentId       String?
  partidaId          String?
  frequency          Frequency
  startDate          DateTime
  endDate            DateTime?
  executionStartTime String   // "08:00"
  executionEndTime   String   // "12:00"
  excludeWeekdays    Int[]    // 0=domingo … 6=sábado
  autoClose          Boolean  @default(false)
  pinned             Boolean  @default(false)
  ownerId            String

  performerUserIds   String[]
  supervisorUserIds  String[]
  followerUserIds    String[]
  performerRoles     String[]
  supervisorRoles    String[]
  followerRoles      String[]

  instances ChecklistInstance[]
}

enum InstanceStatus { PENDING  IN_PROGRESS  DONE  CLOSED_AUTO  INCIDENT }

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

### F1.2 — Admin web

Bajo `apps/web/app/dashboard/checklists/`:

- `templates/page.tsx` — listado con filtros (Local, Departamento, Zona, Asignados), tabla con columnas (Nombre, Descripción, Local, Zona, Nº Tareas, Nº Programaciones, Estado), botón **+ Añadir plantilla**
- `templates/[id]/page.tsx` — editor de plantilla con drag & drop de campos (reusar `@dnd-kit` que ya está). Cada campo abre modal "Editar campo" con tipo, nombre, descripción, imagen ejemplo, opciones de foto
- `templates/new/page.tsx` — wizard creación
- `schedules/page.tsx` — listado de programaciones
- `schedules/new/page.tsx` — wizard de 4 secciones (Información básica, Personas que realizarán, Personas que supervisarán, Opciones avanzadas) — réplica del modal de yurest
- `instances/page.tsx` — calendario semanal/mensual con instancias por día (tipo Google Calendar)
- `reports/operations/page.tsx` — 6 KPIs en tarjetas (Programados, Líneas Supervisadas, Checklists Realizados, Supervisados Totalmente, Valoración Media, Líneas Realizadas)
- `reports/compliance/page.tsx` — % de cumplimiento por plantilla / local
- `reports/incidents/page.tsx` — galería de respuestas marcadas como incidencia
- `reports/responses/page.tsx` — log detallado

API routes en `apps/web/app/api/checklists/...` o server actions en `apps/web/lib/actions/checklists.ts`.

Job programado (cron o `pg_cron`) que **genera instancias** según la programación y la frecuencia. Lanzado diariamente a las 00:01.

### F1.3 — App móvil PWA

Bajo `apps/web/app/m/`:

- `today/page.tsx` — instancias del día asignadas a mí (ejecutor) agrupadas por ventana horaria
- `checklist/[instanceId]/page.tsx` — ejecución pantalla a pantalla:
  - Por campo: imagen ejemplo + nombre + descripción + control (check/sí-no/text/rating 1-10) + cámara
  - Botón "Marcar incidencia" con nota
  - Progreso en topbar, botón "Siguiente" sticky bottom
  - Estado guardado en localStorage para no perder progreso offline
- `checklist/[instanceId]/done/page.tsx` — resumen + envío
- `supervise/page.tsx` — para supervisores: instancias por revisar, con foto y nota
- `notifications/page.tsx` — feed básico (Fase 1 in-app)
- `me/page.tsx` — perfil, logout, install prompt

### F1.4 — Seed de plantillas reales

Replicar las 6 plantillas que vimos en yurest del tenant Jordazola: Apertura, Cierre, MEP cocina, MEP sala, Limpieza cocina, Limpieza sala. Cada una con sus campos.

### Criterios de done F1
- [ ] Crear plantilla con N campos (todos los tipos) desde admin
- [ ] Programar plantilla con frecuencia diaria, ejecutor "Cocinero", supervisor "Encargado"
- [ ] Job nocturno crea instancia para hoy
- [ ] Empleado abre app, ve la instancia en "Hoy", la ejecuta paso a paso con foto, envía
- [ ] Supervisor ve la instancia con foto, valoración media calculada
- [ ] Informe Operaciones muestra los 6 KPIs correctamente

**Esfuerzo estimado: 3 semanas**

---

## Fase 2 — Comunicaciones (2 semanas)

Yurest: Comunicación > Programadas, Averías, Avisos, Eventos, Reuniones, Chats, Listas.

### F2.1 — Modelo

```
enum CommunicationType { SCHEDULED  BREAKDOWN  NOTICE  EVENT  MEETING  LIST }
enum CommunicationStatus { OPEN  IN_PROGRESS  CLOSED }

model Communication {
  id          String @id @default(cuid())
  type        CommunicationType
  title       String
  description String?
  status      CommunicationStatus @default(OPEN)
  locationId  String?
  ownerId     String

  scheduledAt DateTime?
  closedAt    DateTime?

  authorId    String
  assigneeIds String[]
  followerIds String[]

  photos      String[]  // URLs R2

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  comments    CommunicationComment[]
}

model CommunicationComment {
  id               String @id @default(cuid())
  communicationId  String
  communication    Communication @relation(fields: [communicationId], references: [id], onDelete: Cascade)
  authorId         String
  body             String
  photos           String[]
  createdAt        DateTime @default(now())
}
```

### F2.2 — UI

Admin: `dashboard/communications/` con tabs por tipo, formulario crear/editar, hilo de comentarios.
Móvil: `m/inbox` con feed cronológico filtrable por tipo, detalle con comentarios + cámara.

### Criterios de done F2
- [ ] Crear avería con foto desde el móvil, asignarla a un compañero
- [ ] El asignado la ve en su inbox, comenta con foto, cierra
- [ ] Admin ve histórico filtrable

**Esfuerzo estimado: 2 semanas**

---

## Fase 3 — Fichaje (clock-in) (2 semanas)

### F3.1 — Modelo

```
enum ClockInType { IN  OUT  BREAK_START  BREAK_END }

model ClockInRecord {
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id])
  locationId String
  location   Location @relation(fields: [locationId], references: [id])
  type      ClockInType
  at        DateTime @default(now())
  latitude  Float?
  longitude Float?
  photoUrl  String?     // opcional, selfie de fichaje
  signature String?     // firma SVG si se exige
  ownerId   String
}
```

### F3.2 — UI

Móvil: `m/clock-in` con botón gigante "Fichar entrada/salida" según último estado. Opcional geolocalización + foto.
Admin: `dashboard/clock-in/` con tabla diaria/semanal por local + exportar a Excel.

### Criterios de done F3
- [ ] Empleado ficha entrada desde móvil (con foto y ubicación si se exige)
- [ ] Admin ve panel del día con horas trabajadas calculadas
- [ ] Exportable a Excel mes a mes

**Esfuerzo estimado: 2 semanas**

---

## Fase 4 — Horarios y turnos (2 semanas)

### F4.1 — Modelo

```
model Shift {
  id          String @id @default(cuid())
  name        String   // "Mañana", "Tarde", "Cierre"
  startTime   String   // "09:00"
  endTime     String   // "17:00"
  locationId  String
  ownerId     String
}

model ShiftAssignment {
  id        String @id @default(cuid())
  shiftId   String
  shift     Shift @relation(fields: [shiftId], references: [id])
  userId    String
  user      User  @relation(fields: [userId], references: [id])
  date      DateTime
  status    String   // PUBLISHED, DRAFT, SWAPPED
  ownerId   String
  @@unique([userId, date, shiftId])
}
```

### F4.2 — UI

Admin: vista calendario semanal con drag & drop para asignar turnos.
Móvil: `m/schedule` con "mi turno hoy" + semana completa + ver el de compañeros.

**Esfuerzo estimado: 2 semanas**

---

## Fase 5 — Vacaciones y solicitudes (1.5 semanas)

### F5.1 — Modelo

```
enum RequestType   { HOLIDAY  SHIFT_CHANGE  SICK  OTHER }
enum RequestStatus { PENDING  APPROVED  REJECTED  CANCELLED }

model TimeOffRequest {
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id])
  type      RequestType
  startDate DateTime
  endDate   DateTime
  reason    String?
  status    RequestStatus @default(PENDING)
  reviewerId String?
  reviewerNote String?
  reviewedAt DateTime?
  ownerId   String
  createdAt DateTime @default(now())
}
```

### F5.2 — UI

Móvil: `m/requests` para crear y ver estado.
Admin: bandeja de solicitudes + aprobar/rechazar + calendario de ausencias por local.

**Esfuerzo estimado: 1.5 semanas**

---

## Fase 6 — Pedidos a proveedores + Albaranes (3 semanas)

Aprovecha `SupplierProduct` que ya existe.

### F6.1 — Modelo

```
enum OrderStatus { DRAFT  SENT  PARTIALLY_RECEIVED  RECEIVED  CANCELLED }

model SupplierOrder {
  id          String @id @default(cuid())
  number      String      // SO-2026-0001
  supplierId  String      // referencia a Supplier (ya existe? si no, crear)
  locationId  String
  status      OrderStatus @default(DRAFT)
  notes       String?
  sentAt      DateTime?
  expectedAt  DateTime?
  totalAmount Float?
  ownerId     String
  items       SupplierOrderItem[]
  deliveryNotes DeliveryNote[]
  createdAt   DateTime @default(now())
}

model SupplierOrderItem {
  id        String @id @default(cuid())
  orderId   String
  order     SupplierOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  supplierProductId String
  qtyOrdered  Float
  qtyReceived Float @default(0)
  unitPrice   Float?
}

model DeliveryNote {
  id        String @id @default(cuid())
  number    String?
  orderId   String?
  order     SupplierOrder? @relation(fields: [orderId], references: [id])
  receivedAt DateTime
  receivedByUserId String
  signatureUrl String?     // firma SVG
  photoUrls    String[]
  notes        String?
  locationId   String
  ownerId      String
  items        DeliveryNoteItem[]
}

model DeliveryNoteItem {
  id              String @id @default(cuid())
  deliveryNoteId  String
  deliveryNote    DeliveryNote @relation(fields: [deliveryNoteId], references: [id], onDelete: Cascade)
  supplierProductId String
  qty             Float
  unitPrice       Float?
  incident        String?   // "Caducado", "Roto", etc.
}
```

### F6.2 — UI

Admin: `dashboard/orders/` listado + crear (sugerencias automáticas según stock mínimo, pendientes, etc.)
Móvil: `m/orders/new` crear pedido rápido, `m/delivery-notes/sign` firmar albarán recibido con cámara.

**Esfuerzo estimado: 3 semanas**

---

## Fase 7 — Etiquetado de productos (1.5 semanas)

### F7.1 — Modelo

```
model LabelTemplate {
  id          String @id @default(cuid())
  name        String   // "Etiqueta producción", "Etiqueta cámara"
  widthMm     Float
  heightMm    Float
  layoutJson  String   // estructura del template (campos, posiciones)
  ownerId     String
}

model Label {
  id          String @id @default(cuid())
  templateId  String
  template    LabelTemplate @relation(fields: [templateId], references: [id])
  productName String
  batch       String?
  expiresAt   DateTime?
  producedAt  DateTime @default(now())
  producedByUserId String
  qrCode      String?
  locationId  String
  ownerId     String
}
```

### F7.2 — UI

Móvil: `m/labels` con teclas grandes para imprimir etiqueta rápida (selección de producto + cantidad + caducidad).
Admin: gestión de plantillas + histórico.

Integración con impresora térmica (Bluetooth desde móvil, WebUSB o servicio aparte). Empezar con vista previa imprimible navegador.

**Esfuerzo estimado: 1.5 semanas**

---

## Fase 8 — Cierres de caja (1.5 semanas)

### F8.1 — Modelo

```
model CashClosing {
  id           String @id @default(cuid())
  date         DateTime
  shiftId      String?       // referencia turno si aplica
  locationId   String
  totalIncome  Float
  totalExpense Float
  totalCash    Float
  totalCard    Float
  notes        String?
  photoUrls    String[]
  closedByUserId String
  ownerId      String
  incomes      CashIncome[]
  expenses     CashExpense[]
}

model CashIncome {
  id        String @id @default(cuid())
  closingId String
  closing   CashClosing @relation(fields: [closingId], references: [id], onDelete: Cascade)
  category  String        // "Comidas", "Bebidas", "Tickets"
  amount    Float
}

model CashExpense {
  id        String @id @default(cuid())
  closingId String
  closing   CashClosing @relation(fields: [closingId], references: [id], onDelete: Cascade)
  category  String        // "Personal", "Compras", "Otros"
  amount    Float
  receipt   String?       // URL foto recibo
}
```

### F8.2 — UI

Móvil: `m/cash-closing/new` con teclado numérico grande, categorías.
Admin: resumen diario/semanal/mensual por local.

**Esfuerzo estimado: 1.5 semanas**

---

## Fase 9 — Finanzas / EBITDA (2 semanas)

Sobre lo que ya tenemos (compras, pedidos, recetas con coste, cierres caja) calculamos:
- Ingresos del periodo
- Coste de mercancía (basado en pedidos recibidos + escandallos)
- Gastos de personal (de payroll)
- Gastos generales
- EBITDA por local y consolidado

`dashboard/finance/ebitda/page.tsx` con filtros locales × rango fechas.

**Esfuerzo estimado: 2 semanas**

---

## Fase 10 — Push web + pulido final (1 semana)

- Web Push API con VAPID keys
- Suscripción del navegador → guardar `PushSubscription` por usuario
- Service worker handler de push (notification.show)
- Envío de push al asignar tarea/comunicación/turno
- Página de preferencias `m/notifications-config` (qué quiero recibir)
- Pasada de UX final, auditoría de accesibilidad básica, lighthouse PWA score

**Esfuerzo estimado: 1 semana**

---

## Resumen de tiempos

| Fase | Módulo | Semanas |
|------|--------|---------|
| F0 | Cimientos (Location, R2, PWA, permisos) | 1 |
| F1 | Checklists (admin + móvil + informes) | 3 |
| F2 | Comunicaciones | 2 |
| F3 | Fichaje | 2 |
| F4 | Horarios y turnos | 2 |
| F5 | Vacaciones y solicitudes | 1.5 |
| F6 | Pedidos + albaranes | 3 |
| F7 | Etiquetado | 1.5 |
| F8 | Cierres de caja | 1.5 |
| F9 | EBITDA | 2 |
| F10 | Push web + pulido | 1 |
| **Total** | | **~20.5 semanas (≈5 meses)** |

---

## Lo que dejamos fuera del roadmap (yurest lo tiene, nosotros no — por ahora)

- **ACADEMY / formación** — yurest tiene un módulo de formación interna. Es un producto en sí mismo, fuera de alcance.
- **Asistente IA / chat conversacional** — yurest tiene `assistant-chat`. Posible añadido futuro vía Claude API.
- **Modules-store / widgets-store dinámicos** — yurest permite añadir módulos. Sobreingeniería para nuestro caso.
- **Multi-empresa / multi-cliente bajo un mismo SaaS** — somos tenant único por admin. Si en el futuro queremos vender la app a otros restaurantes, refactor pendiente.

---

## Cómo continuar

1. **Aprobar este roadmap** (o ajustar orden/alcance de fases)
2. **Empezar por Fase 0** (cimientos) — sin esto no podemos hacer nada más
3. Al cerrar cada fase, hacemos demo + tag de versión + decidimos si pasamos a la siguiente o pivotamos

Para empezar Fase 0 necesito que me confirmes:
- Si quieres que yo cree el Space en Digital Ocean (te guío paso a paso) o lo creas tú y me pasas las credenciales
- Si los locales son **SOTO del PRIOR** y **Montagu Pamplona** (vistos en yurest) o hay más
- Si los empleados actuales pertenecen ya a un local concreto (toca asignárselos al hacer la migración)
