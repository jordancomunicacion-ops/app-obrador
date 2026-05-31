# Handoff: migración de RRHH + finanzas de cocina → `contabilidad.sotodelprior.com`

> **Objetivo.** Mover 5 módulos (Fichajes, Turnos, Solicitudes, Cierres de caja, Finanzas/EBITDA)
> de la app de **cocina** (`app-cocina`) a la app de **contabilidad**, sin perder datos.
> Cocina = solo cocina; RRHH y contabilidad (incl. ficha completa del empleado) viven en contabilidad.
>
> **Estado actual:** paso 1 hecho — ya están **fuera del menú** de cocina (PR #13, en `main`).
> Las rutas siguen existiendo por URL y **no se ha borrado nada**. Este documento es el paso 2
> (copiar/adaptar en contabilidad) y prepara el paso 3 (eliminar de cocina).

---

## 0. Cómo dar acceso a un agente para hacer esto

El agente de esta sesión está **restringido al repo `jordancomunicacion-ops/app-cocina`** y no puede
leer ni escribir en el repo de contabilidad. Para ejecutar el paso 2 hay dos vías:

**Opción A — Nueva sesión de Claude Code on the web sobre el repo de contabilidad (recomendada).**
1. Entra en `claude.ai/code`.
2. Crea/conecta el repositorio de la app de contabilidad (el que despliega `contabilidad.sotodelprior.com`).
3. Elige una política de red que permita `npm install` / acceso a la base de datos si vas a correr migraciones.
4. Abre una sesión en ese repo y pega el **prompt de la sección 6** de este documento.
   (Doc de referencia del entorno web: https://code.claude.com/docs/en/claude-code-on-the-web)

**Opción B — Claude Code local en la carpeta del repo de contabilidad.**
1. `cd` al repo de contabilidad, `claude` en la terminal.
2. Copia este archivo (`docs/migracion-contabilidad-handoff.md`) dentro de ese repo, o pega su contenido,
   y usa el prompt de la sección 6.

> Si la app de contabilidad **comparte base de datos** con cocina, el paso 2 puede ser "solo construir las
> pantallas" (los datos ya están). Si tiene **base de datos separada**, hay que copiar datos además del código
> (sección 4). **Confirmar este punto antes de empezar.**

---

## 1. Alcance: qué se mueve

| Módulo | Ruta en cocina | Modelo Prisma | Enums |
|---|---|---|---|
| Fichajes | `/dashboard/clock-in` | `ClockIn` | — |
| Turnos | `/dashboard/shifts` | `Shift` | — |
| Solicitudes (vacaciones/bajas/cambios) | `/dashboard/requests` | `EmployeeRequest` | `EmployeeRequestType`, `EmployeeRequestStatus` |
| Cierres de caja | `/dashboard/cash` | `CashClosing` | `CashClosingShift` |
| Finanzas / EBITDA | `/dashboard/finance` | `FinancialEntry` | `FinancialEntryType` |

Ninguno tiene subtablas de línea/detalle: son tablas planas.

**Fuente común del fichaje:** el lector de huella físico es la fuente única. De ahí beben cocina (solo lo que
necesite para analítica de tareas) y contabilidad (nóminas/variables). En contabilidad, `ClockIn`/`Shift` son la
base de cálculo de horas; en cocina, tras el paso 3, se conserva como mucho un espejo de solo-lectura si hace falta.

---

## 2. Modelos Prisma (copiar literalmente a contabilidad)

> Origen: `apps/web/prisma/schema.prisma` de `app-cocina`. Tipos de importe en `Float` (misma convención del schema).
> En contabilidad puedes endurecer a `Decimal` si el proyecto lo usa; mantener la semántica.

```prisma
model ClockIn {
  id String @id @default(cuid())
  ownerId String
  owner   User   @relation("ClockInOwner", fields: [ownerId], references: [id])
  workerId String
  worker   User   @relation("ClockInWorker", fields: [workerId], references: [id])
  locationId String?
  location   Location? @relation("ClockInLocation", fields: [locationId], references: [id])
  startAt        DateTime
  endAt          DateTime?
  startPhotoUrl  String?
  endPhotoUrl    String?
  startSignature String?
  endSignature   String?
  note           String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, workerId, startAt])
  @@index([ownerId, locationId, startAt])
}

model Shift {
  id String @id @default(cuid())
  ownerId String
  owner   User   @relation("ShiftOwner", fields: [ownerId], references: [id])
  workerId String
  worker   User   @relation("ShiftWorker", fields: [workerId], references: [id])
  locationId String?
  location   Location? @relation("ShiftLocation", fields: [locationId], references: [id])
  date          DateTime
  startTime     String    // "08:00"
  endTime       String    // "16:00"
  breakMinutes  Int       @default(0)
  note          String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, date])
  @@index([ownerId, workerId, date])
}

enum EmployeeRequestType { HOLIDAY SICK_LEAVE PERSONAL SHIFT_SWAP OTHER }
enum EmployeeRequestStatus { PENDING APPROVED REJECTED CANCELLED }

model EmployeeRequest {
  id String @id @default(cuid())
  ownerId String
  owner   User   @relation("EmployeeRequestOwner", fields: [ownerId], references: [id])
  workerId String
  worker   User   @relation("EmployeeRequestWorker", fields: [workerId], references: [id])
  type   EmployeeRequestType
  status EmployeeRequestStatus @default(PENDING)
  startDate DateTime
  endDate   DateTime?
  reason   String?
  decision String?
  resolverUserId String?
  resolver       User?   @relation("EmployeeRequestResolver", fields: [resolverUserId], references: [id])
  resolvedAt     DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, status, startDate])
  @@index([ownerId, workerId, startDate])
}

enum CashClosingShift { MORNING EVENING FULL_DAY }

model CashClosing {
  id String @id @default(cuid())
  ownerId String
  owner   User   @relation("CashClosingOwner", fields: [ownerId], references: [id])
  locationId String?
  location   Location? @relation("CashClosingLocation", fields: [locationId], references: [id])
  closedByUserId String?
  closedBy       User?   @relation("CashClosingCloser", fields: [closedByUserId], references: [id])
  date  DateTime
  shift CashClosingShift @default(FULL_DAY)
  cashAmount         Float @default(0)
  expectedCashAmount Float @default(0)
  cardAmount         Float @default(0)
  otherAmount        Float @default(0)
  tips               Float @default(0)
  diff Float @default(0)
  notes    String?
  photoUrl String?
  isLocked Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([ownerId, locationId, date, shift])
  @@index([ownerId, date])
}

enum FinancialEntryType { INCOME EXPENSE_OPERATING EXPENSE_PAYROLL EXPENSE_SUPPLIER EXPENSE_OTHER }

model FinancialEntry {
  id String @id @default(cuid())
  ownerId String
  owner   User   @relation("FinancialEntryOwner", fields: [ownerId], references: [id])
  createdByUserId String?
  createdBy       User?   @relation("FinancialEntryCreator", fields: [createdByUserId], references: [id])
  locationId String?
  location   Location? @relation("FinancialEntryLocation", fields: [locationId], references: [id])
  type     FinancialEntryType
  category String
  date     DateTime
  amount   Float
  description String?
  receiptUrl  String?
  cashClosingId   String?  // -> CashClosing.id (migra junto)
  purchaseOrderId String?  // -> PurchaseOrder.id (SE QUEDA en cocina; ver §3)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([ownerId, type, date])
  @@index([ownerId, locationId, date])
}
```

---

## 3. Dependencias que cruzan el límite (decisión clave)

Los 5 modelos referencian `User` y (opcional) `Location`, que **se quedan en cocina**. En contabilidad necesitas
representar empleados y locales. Decide una estrategia (confirmar con Jordan):

- **Si comparten base de datos / mismos IDs:** las FK a `User`/`Location` siguen siendo válidas tal cual. Lo más simple.
- **Si bases separadas:** crea en contabilidad sus propias tablas de empleados/locales y una **tabla de mapeo**
  `cocinaUserId ↔ contabilidadEmpleadoId` (y lo mismo para locales) para reescribir los IDs al copiar datos.

Casos especiales:
- `FinancialEntry.cashClosingId` → apunta a `CashClosing`, que **también migra**: la relación se mantiene.
- `FinancialEntry.purchaseOrderId` → apunta a `PurchaseOrder`, que **se queda en cocina**. En contabilidad:
  guárdalo como `String` suelto (referencia informativa, sin FK) o elimínalo si contabilidad no necesita la traza al pedido.

---

## 4. Server actions / lógica a replicar

Origen en `apps/web/app/lib/actions/`. Replicar la misma semántica en contabilidad:

| Módulo | Archivo origen | Funciones |
|---|---|---|
| Fichajes | `clock-in.ts` | `getCurrentClockIn`, `clockIn`, `clockOut`, `adminUpdateClockIn`, `adminDeleteClockIn` |
| Turnos | `shifts.ts` | `createShift`, `updateShift`, `deleteShift`, `copyWeek(fromMondayISO, toMondayISO)` |
| Solicitudes | `employee-requests.ts` | `createRequest`, `cancelMyRequest`, `approveRequest`, `rejectRequest` (helper `resolveRequest`) |
| Cierres de caja | `cash-closings.ts` | `createOrUpdateClosing` (upsert por `ownerId+locationId+date+shift`), `lockClosing`, `deleteClosing` |
| Finanzas | `financial-entries.ts` | `createEntry`, `deleteEntry` |

**Páginas** (`apps/web/app/dashboard/...`): `clock-in/`, `today/clock-in/`, `shifts/`, `requests/`,
`today/requests/`, `cash/`, `today/cash/`, `finance/`.
**Componentes** (`apps/web/app/ui/...`): `today/clock-in-card`, `shifts/{shift-cell,copy-week-button}`,
`requests/admin-request-row`, `today/{my-request-row,request-form}`, `cash/closing-form`, `finance/entry-form`.
**API de exportación CSV** (`apps/web/app/api/...`): `clock-in/export`, `cash-closings/export`, `finance/export`.

---

## 5. Copia de datos (solo si las BBDD son distintas)

Orden recomendado para respetar FKs:
1. Garantizar `User` y `Location` (o el mapeo) en contabilidad.
2. `ClockIn`, `Shift`, `EmployeeRequest`, `CashClosing` (independientes entre sí).
3. `FinancialEntry` al final (puede referenciar `CashClosing`).

Mecanismo sugerido: exportar de cocina con los endpoints CSV existentes **o** un script Prisma que lea de la BD de
cocina y escriba en la de contabilidad reescribiendo IDs según el mapeo. Verificar conteos por tabla antes/después.

---

## 6. Prompt listo para pegar en la sesión de contabilidad

```
Contexto: estoy migrando 5 módulos desde la app de cocina (repo app-cocina) a esta app de
contabilidad: Fichajes (ClockIn), Turnos (Shift), Solicitudes (EmployeeRequest), Cierres de
caja (CashClosing) y Finanzas/EBITDA (FinancialEntry). La especificación completa (modelos
Prisma literales, enums, server actions, páginas, componentes y dependencias) está en el
documento docs/migracion-contabilidad-handoff.md del repo app-cocina; te lo pego a continuación
si no tienes acceso a ese repo.

Tareas:
1. Dime primero si esta app comparte base de datos con cocina o usa una separada (mira el
   schema.prisma y la config de conexión) — la estrategia de FKs depende de eso.
2. Añade los 5 modelos + sus enums al schema.prisma de esta app (adaptando User/Location a como
   se modelen aquí los empleados y locales), y genera la migración.
3. Crea las páginas/acciones equivalentes para gestionar estos módulos.
4. Si las BBDD son distintas, propón un script de copia de datos con reescritura de IDs.
NO borres nada en cocina: la limpieza del lado cocina la hago en otra sesión cuando esto esté listo.
Trabaja en una rama y abre un PR en draft.

[Pega aquí el contenido de docs/migracion-contabilidad-handoff.md]
```

---

## 7. Paso 3 (lado cocina, DESPUÉS de que esto esté hecho)

Cuando el paso 2 esté en producción en contabilidad y los datos verificados, en `app-cocina`:
- Borrar rutas `apps/web/app/dashboard/{clock-in,shifts,requests,cash,finance}` y sus equivalentes en `today/`.
- Borrar `apps/web/app/lib/actions/{clock-in,shifts,employee-requests,cash-closings,financial-entries}.ts`.
- Borrar componentes UI y API de export listados en §4.
- Quitar del `schema.prisma` los modelos `ClockIn`, `Shift`, `EmployeeRequest`, `CashClosing`, `FinancialEntry`
  y sus enums + relaciones inversas en `User`/`Location`; generar migración de borrado.
- (Pendiente de decidir) si cocina necesita un espejo de solo-lectura de fichajes para analítica de tareas,
  conservar solo eso.

Ver también `docs/fase-3-plan-reestructuracion.md` §E.
