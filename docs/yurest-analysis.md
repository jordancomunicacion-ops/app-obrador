# Análisis de yurest — plan de clonación

**Fecha:** 2026-05-29
**Fuente:** Inspección directa de `cliente.yurest.com` (admin web) y `movil.v3.yurest.com` (app móvil), con cuenta `administracion@jordazola.com` (sesión web activa). Versión observada de yurest: **4.1.8**.

---

## 1. Resumen ejecutivo

Yurest es una plataforma SaaS para gestión integral de restauración con dos productos:

1. **Admin web (`cliente.yurest.com`)** — backoffice donde los responsables crean plantillas de checklists, programan ejecuciones, definen empleados/roles/locales y consultan informes.
2. **App móvil (`movil.v3.yurest.com`)** — webapp en **Angular empaquetada con Capacitor** (iOS + Android nativos + PWA), donde los empleados ejecutan las tareas asignadas y los responsables supervisan en movilidad.

El módulo de **tareas/checklists** no es una lista plana de TODOs: es un sistema **plantilla → programación → instancia → respuesta**, con foto opcional/obligatoria, roles, supervisores, frecuencias y cierre automático. Esto es lo que hace funcional el modelo en una cocina con turnos.

La app móvil cubre mucho más que tareas: fichaje (clock-in), vacaciones, horarios, inventario, etiquetado, recetas, escandallos, pedidos, albaranes, cierres de caja, EBITDA, comunicación interna, chats con asistente. El alcance es muy amplio; este documento prioriza tareas + movilidad por petición.

---

## 2. Mapa de navegación (admin web)

Sidebar principal:

- **Dashboard** (`/admin`)
- **Informes** > **Tareas** >
  - Operaciones (`/admin/informes/operaciones`) — KPIs: Programados, Líneas Supervisadas, Checklists Realizados, Supervisados Totalmente, Valoración Media, Líneas Realizadas
  - Cumplimiento de checklists
  - Incidencias de checklists
  - Respuestas de checklists
- **Calendarios** > Checklists/Tareas
- **Checklists** >
  - **Plantillas** (`/admin/tareas/checklists/modelos`)
  - **Programados**
- **Comunicación** > Programadas, Averías, Avisos, Eventos, Reuniones, Chats, Listas
- **Recursos Humanos** > Empleados (`/admin/usuarios/roles`)

Topbar: buscador, ACADEMY (formación), panel de alertas, visor móvil (`movil.v3.yurest.com/assets/visor/`), asistentes, soporte, changelog, configuración (`/admin/configuracion/...` con almacén, cocina, locales, productos, tareas, perfil empresa).

---

## 3. Módulo de Tareas (análisis a fondo)

### 3.1 Arquitectura conceptual

```
Plantilla (modelo)         →  Programación (asignación)  →  Instancia diaria  →  Respuestas
─────────────────             ─────────────────────────     ────────────────     ──────────
Reutilizable.                 Recurrencia (diario,         Una por fecha        Por cada campo
Tiene N campos.               semanal, mensual…).          de ejecución.        de la plantilla,
Tiene tipos:                  Ata plantilla a local,                            con valor + foto
título/check/                 dpto, partida, ejecutores,                        opcional.
texto/SiNo/                   supervisores y horario.                           Incidencias si
rating 1-10.                  Soporta cierre automático,                        falla un campo.
                              seguidores, días excluidos.
```

### 3.2 Plantillas de checklist (`/admin/tareas/checklists/modelos`)

Listado con filtros: **Locales, Departamentos, Zona, Asignados**.

Columnas: Nombre · Descripción · Local · Zona · Nº de Tareas · Nº de Programaciones · Estado (Activo/Inactivo).

Ejemplos reales encontrados en el tenant JORDAZOLA:
- Apertura (MONTAGU, 10 tareas; SOTO del PRIOR, 13 tareas, 2 programaciones)
- Cierre (MONTAGU 9 tareas; SOTO 15 tareas)
- Cebadero, Corral recría, Corrales madres (más enfocados a obrador/granja)
- Limpieza cocina, Limpieza sala, MEP cocina, MEP SALA, Montar terraza, Recoger terraza, Reposición genérica

### 3.3 Detalle de un campo de tarea (modal "Editar campo")

Campos del formulario:

| Campo | Tipo UI | Valores |
|-------|---------|---------|
| Tipo* | select | Título, Check, Texto, Si/No, Valoración (1-10) |
| Nombre | text | Libre |
| Descripción | textarea | Libre, soporta texto largo |
| Imagen de ejemplo | file upload | Foto de referencia (cómo debe verse el resultado) |
| Opciones de foto | select | Sin foto, Foto opcional, Foto obligatoria |

**Tipos de campo y semántica:**

- **Título** — separador/cabecera (agrupa visualmente)
- **Check** — checkbox simple "hecho / no hecho"
- **Texto** — campo libre de respuesta
- **Si/No** — radio binario
- **Valoración (1-10)** — escala numérica

Cada campo (excepto Título) puede pedir foto adjunta como evidencia.

### 3.4 Programación de checklist (modal "Nueva asignación checklist")

Cuatro secciones:

**A. Información básica**
- Filtro: Locales (con botón "Familia" para grupos de locales)
- Local* (requerido)
- Departamento (COCINA / Limpieza / Oficina / SALA — extensible)
- Partida (sub-rol: Ayudante / Cocinero / …)
- Plantillas* (la plantilla a aplicar)
- **Frecuencia\*** — Diario, Semanal, Quincenal, Mensual, Trimestral, Semestral, Anual
- Fecha inicio* / Fecha fin
- Fijar checklist (checkbox — fija orden/posición)
- Hora ejecución inicio* / Hora ejecución fin*
- Cierre automático (checkbox — cierra la instancia al pasar la hora fin)
- Excluir días: Lunes-Domingo (checkbox por día)

**B. Personas que realizarán el checklist**
- Roles (multi-select de roles del personal)
- Empleados (multi-select de empleados concretos — bypass del rol)

**C. Personas que supervisarán el checklist**
- Supervisores (empleados concretos)
- Supervisores por role

**D. Opciones avanzadas (seguidores)**
- Seguidores (empleados que solo leen)
- Seguidores por role
- Cuándo ven el checklist: Siempre / (otras opciones)

### 3.5 Informes de tareas

Cuatro reportes pre-construidos bajo Informes > Tareas:

1. **Operaciones** — vista agregada con KPIs por rango de fechas y locales:
   - Programados (Nº de instancias creadas)
   - Líneas Supervisadas (%)
   - Checklists Realizados (%)
   - Supervisados Totalmente (%)
   - Valoración Media (%)
   - Líneas Realizadas (%)
2. **Cumplimiento de checklists** — % de cumplimiento por plantilla / local
3. **Incidencias de checklists** — campos marcados como problema, con foto y motivo
4. **Respuestas de checklists** — registro detallado por instancia

Todas exportables a PDF, Excel, CSV.

---

## 4. App móvil (Angular + Capacitor)

### 4.1 Stack

- **Framework:** Angular (bundle estructura `main.[hash].js`, `runtime.[hash].js`, `polyfills.[hash].js`, `scripts.[hash].js`)
- **Wrapper nativo:** **Capacitor** — `window.Capacitor` está definido. Esto da app nativa para iOS y Android con un solo codebase web.
- **PWA:** también funciona como PWA web instalable (`apple-mobile-web-app-capable=yes`, `mobile-web-app-capable=yes`, viewport con `viewport-fit=cover`)
- **Service Worker:** sí, presencia de `ngsw.json` (Angular Service Worker)
- **Push:** la URL de login incluye `?pushToken=` → la app registra un token push (Firebase Cloud Messaging probablemente) y lo envía al backend en el login
- **Visor demo:** `movil.v3.yurest.com/assets/visor/` carga la app en un marco de iPhone

### 4.2 Rutas de la SPA (extraídas del bundle)

La app móvil cubre **mucho más que tareas**. Rutas detectadas (`path:"..."` en el bundle):

**Auth / general**
- `onboarding`, `login`, `register`, `forget-pass`, `visor`, `tabs`, `notifications`, `notifications-config`, `edit-password`, `edit-profile`, `edit-pin`, `gallery`, `file-store`, `file-info`

**Tareas (lo que nos interesa replicar)**
- `task/:id` — detalle de una instancia
- `task-store` — listar/crear
- `task-options` — opciones
- `task-detail-report` — informe de una tarea
- `image-revi[sion]` — revisión de fotos (incidencias)

**Comunicación**
- `communication-store`, `communication/:id`, `communication-options`
- `event/:id`
- `assistant-chat` — chat con asistente IA

**RRHH (lo segundo más importante para el roadmap)**
- `clock-in-store`, `sign-clock-in`, `clock-in-detail-report`, `share-clock-in-report` — **fichaje**
- `schedule-store` — **horarios/turnos**
- `holiday-store` — **vacaciones**
- `requests-store` — **solicitudes**
- `users/:id`, `users-store`
- `payroll-review` — **revisión de nómina**

**Inventario / etiquetado / producción**
- `product/:id`, `product-store`, `edit-product`
- `inventory-stock`, `inventory-stock-options`, `stock-products-revision`, `inventory-event/:id`
- `labeled-store`, `labeled-history`, `labeled-add-info`, `print-label-options` — etiquetado
- `recipe/:id`, `recipe-costing/:id`, `elaboration/:id`
- `mise-en-place-options`, `production-elaboration-store`, `production-recipe-store`, `min-max-store`

**Compras**
- `provider/:id`, `provider-store`, `provider-contact-store`, `provider-product-store`, `product-provider-store`
- `order/:id`, `order-store`, `add-previous-order`, `add-products-order`, `select-pendents-products`, `send-order-email`, `suggested-products-list`
- `delivery-note/:id`, `delivery-note-store`, `add-products-delivery-note`, `sign-delivery-note`, `delivery-note-review/:id`

**Finanzas**
- `cash-closing/:id`, `cash-closing-store`
- `ebitda-detail`, `ebitda-report-options`
- `income-store`, `personal-payments-store`, `purchase-payments-store`
- `general-expenses-store`, `personal-expenses-store`, `expenses-options`, `expense-detail`
- `breakdown-budget-store`

**Otros**
- `widgets-store`, `widgets-filters` — dashboard personalizable
- `videos-viewer`, `multisession-list`, `keyboard-modal`, `bottle-meter`, `modules-store`, `modules-items`
- `tasks-reports-options`, `purchases-reports-options`, `ranking-list`

### 4.3 Capacidades nativas detectadas

- Push notifications (token capturado en login)
- Cámara (campos con "Foto obligatoria")
- Geolocalización (probable para fichaje y firmas)
- Firma digital (`sign-clock-in`, `sign-delivery-note`)
- Almacenamiento offline vía Service Worker (Angular ngsw)

---

## 5. Comparativa con nuestra app actual

Nuestra app (`apps/web`) es **Next.js + Prisma + NextAuth**. Estado actual relevante:

- Rutas existentes: `dashboard/{employees,events,inventory,menu-planning,mise-en-place,obrador,products,profile,purchasing,recipes,settings,storage,system,tasks}`
- Modelo `Task` actual (`prisma/schema.prisma:426`) es **plano**: title, description, assignedToUserId, status (PENDING/IN_PROGRESS/DONE/ISSUE), plannedStart/End, realStart/End, recipe relation, action, technique. Orientado a producción/cocina, **no a checklists**.
- No hay aún: ChecklistTemplate, ChecklistField, ChecklistSchedule, ChecklistInstance, ChecklistResponse.
- No hay PWA configurada, ni Service Worker, ni Capacitor.
- Sí hay `employees` y `obrador` (dashboard) base, pero no fichaje ni horarios.

---

## 6. Plan de clonación priorizado

### Fase 1 — Modelo de datos de checklists (semana 1)

Añadir al schema Prisma:

```
model ChecklistTemplate {
  id            String   @id @default(cuid())
  name          String
  description   String?
  locationId    String?     // local (multi-tenant)
  departmentId  String?
  zoneId        String?
  isActive      Boolean  @default(true)
  fields        ChecklistField[]
  schedules     ChecklistSchedule[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum ChecklistFieldType { TITLE  CHECK  TEXT  YES_NO  RATING_1_10 }
enum PhotoRequirement   { NONE   OPTIONAL  REQUIRED }

model ChecklistField {
  id              String   @id @default(cuid())
  templateId      String
  template        ChecklistTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  order           Int
  type            ChecklistFieldType
  name            String
  description     String?
  exampleImageUrl String?
  photoRequirement PhotoRequirement @default(NONE)
}

enum Frequency { DAILY WEEKLY BIWEEKLY MONTHLY QUARTERLY SEMIANNUAL ANNUAL }

model ChecklistSchedule {
  id              String   @id @default(cuid())
  templateId      String
  template        ChecklistTemplate @relation(fields: [templateId], references: [id])
  locationId      String
  departmentId    String?
  partidaId       String?   // sub-rol
  frequency       Frequency
  startDate       DateTime
  endDate         DateTime?
  executionStartTime String  // "08:00"
  executionEndTime   String  // "12:00"
  excludeWeekdays Int[]     // 0=domingo … 6=sábado
  autoClose       Boolean  @default(false)
  pinned          Boolean  @default(false)

  performerRoles    Role[]     @relation("SchedulePerformerRoles")
  performerUsers    User[]     @relation("SchedulePerformerUsers")
  supervisorRoles   Role[]     @relation("ScheduleSupervisorRoles")
  supervisorUsers   User[]     @relation("ScheduleSupervisorUsers")
  followerRoles     Role[]     @relation("ScheduleFollowerRoles")
  followerUsers     User[]     @relation("ScheduleFollowerUsers")
  followerVisibility String     @default("ALWAYS")

  instances ChecklistInstance[]
}

enum InstanceStatus { PENDING  IN_PROGRESS  DONE  CLOSED_AUTO  INCIDENT }

model ChecklistInstance {
  id          String   @id @default(cuid())
  scheduleId  String
  schedule    ChecklistSchedule @relation(fields: [scheduleId], references: [id])
  dueDate     DateTime  // fecha concreta de ejecución
  status      InstanceStatus @default(PENDING)
  openedAt    DateTime?
  closedAt    DateTime?
  closedByUserId String?
  rating      Float?   // valoración media (0-100)
  responses   ChecklistResponse[]
}

model ChecklistResponse {
  id          String   @id @default(cuid())
  instanceId  String
  instance    ChecklistInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  fieldId     String
  field       ChecklistField    @relation(fields: [fieldId], references: [id])

  valueText   String?  // para Texto
  valueBool   Boolean? // para Check / Si-No
  valueRating Int?     // 1-10
  photoUrl    String?
  isIncident  Boolean  @default(false)
  incidentNote String?
  answeredByUserId String?
  answeredAt  DateTime?
}
```

Migración + seed inicial con las 6 plantillas reales que vimos (Apertura, Cierre, MEP cocina, MEP sala, Limpieza cocina, Limpieza sala) para SOTO del PRIOR.

### Fase 2 — CRUD admin web (semana 2)

Páginas Next.js bajo `apps/web/app/dashboard/checklists/`:

- `templates/page.tsx` — listado de plantillas con filtros (local, dpto, zona, asignados) — replica `/admin/tareas/checklists/modelos`
- `templates/[id]/page.tsx` — edición de plantilla con drag & drop de campos
- `templates/[id]/fields/[fieldId]/edit` — modal "Editar campo"
- `schedules/page.tsx` — listado de programaciones
- `schedules/new` — wizard de programación (4 secciones colapsables como yurest)
- `instances/page.tsx` — calendario de instancias (vista calendario y tabla)
- `reports/operations/page.tsx` — los 6 KPIs en tarjetas

API routes correspondientes en `apps/web/app/api/checklists/...`.

### Fase 3 — Ejecución móvil (semana 3-4)

**Decisión arquitectónica clave:** ¿Next.js PWA, o Capacitor wrap?

| Opción | Pro | Contra |
|--------|-----|--------|
| **Next.js PWA pura** | Sin reescritura, una sola base de código. Service Worker con next-pwa. | Push notifications en iOS son limitadas (iOS 16.4+ y solo desde Home Screen). Sin acceso pleno a cámara/firma nativa. |
| **Capacitor wrap del frontend móvil** | App nativa iOS+Android, push pleno, hardware completo. Mismo enfoque que yurest. | Mantener dos builds (web admin + app móvil). Requiere Apple Developer + Google Play. |

Recomendación: **empezar con Next.js PWA** (rápido, validar UX) y, si el equipo lo pide, envolver con Capacitor más adelante. La frontera entre admin (desktop-first) y móvil empleado (mobile-first) puede ser una **ruta `/m`** dentro del mismo Next.js con layout propio.

Pantallas mobile-first prioritarias:

1. `/m/login` — login simple, recordar último user
2. `/m/today` — lista de checklists pendientes hoy del usuario logado (las instancias asignadas)
3. `/m/checklist/[instanceId]` — ejecución pantalla a pantalla:
   - Por cada campo: imagen de ejemplo + nombre + descripción + control (check/sí-no/text/rating) + cámara para foto
   - Botón "Marcar incidencia" con nota
   - Progreso top y "Siguiente" sticky bottom
4. `/m/supervise` — para supervisores: lista de instancias por revisar, con foto y respuestas
5. `/m/notifications` — feed de avisos
6. (Fase 4) `/m/clock-in` — fichaje con foto/firma

Configurar:
- `next.config.ts` con `next-pwa` o manifest manual
- Service Worker básico (caché offline de instancias en curso)
- Firebase Cloud Messaging para web push (opcional fase 1, requerido si se envuelve con Capacitor)
- Compresión de fotos en cliente antes de subir

### Fase 4 — Reportes y polish (semana 5)

- Informe de Operaciones con los 6 KPIs (reutilizar gráficos ya existentes en dashboard)
- Cumplimiento por plantilla/local
- Incidencias (galería de fotos marcadas como problema)
- Exportación PDF/Excel

### Fase 5 (opcional) — RRHH móvil

Si se decide ampliar:
- Fichaje (clock-in) con foto + firma
- Horarios/turnos
- Solicitudes (vacaciones, cambios)
- Chat asistente

---

## 7. Decisiones pendientes para el usuario

1. **Multi-local** — ¿la app servirá solo a SOTO del PRIOR / Montagu, o queremos arquitectura multi-tenant desde el principio (locationId en todas las tablas)?
2. **Wrap nativo** — ¿queremos app en App Store / Play Store, o nos basta con PWA web instalable?
3. **Roles existentes** — ¿reutilizamos los `User.role` y `Employee` actuales como base de "ejecutores/supervisores", o creamos un nuevo concepto de "rol de plantilla"?
4. **Cierre automático** — confirmar si replicamos la lógica yurest (al pasar la hora fin, se cierra la instancia con lo respondido y se generan incidencias para lo no respondido).
5. **Calendario unificado** — yurest tiene un "Calendarios > Checklists/Tareas" que mezcla todas las programaciones. ¿Lo replicamos como vista única?

---

## 8. Referencias rápidas

- Admin web yurest: `https://cliente.yurest.com/admin`
- App móvil yurest: `https://movil.v3.yurest.com`
- Visor demo iPhone: `https://movil.v3.yurest.com/assets/visor/`
- Soporte yurest: `https://soporte.yurest.com/hc/es`
- Academy formación: `https://yurestacademy.app.clientclub.net`

**Cuenta usada para la investigación:** `administracion@jordazola.com` (sesión web ya autenticada). El PIN 7989 no funcionó en la app móvil — para profundizar en pantallas autenticadas del móvil hace falta el password correcto o un login de prueba.
