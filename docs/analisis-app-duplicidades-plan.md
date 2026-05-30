# Análisis de `app-cocina` — duplicidades, facilidad funcional y plan de mejora

> Documento de análisis (solo lectura, no implica cambios de código).
> Fecha: 2026-05-30 · Rama: `claude/app-analysis-dedup-plan-PKRlR`

---

## 1. Resumen ejecutivo

`app-cocina` es un monorepo con una sola aplicación (`apps/web`) construida en **Next.js 16 + React 19 + Prisma + PostgreSQL**, multi-tenant, para la gestión integral de una cocina/restaurante (clon funcional de "yurest", según `docs/yurest-*.md`).

**Dimensiones aproximadas:**
- ~100 páginas bajo `app/dashboard/**`
- ~60 modelos de datos en `prisma/schema.prisma` (1.580 líneas)
- 19 ficheros de server actions en `app/lib/actions/**` (~4.200 líneas)
- Lógica de negocio en `app/lib/*.ts` (costing, production, shopping, pos, units…)
- Infraestructura en `lib/**` (prisma, auth, storage S3, push, reports)

**Conclusión:** la app es funcionalmente rica pero arrastra **deuda técnica por duplicación** en cuatro frentes: (a) un "mundo Obrador" paralelo que reimplementa el catálogo, (b) tres sistemas de "tareas" coexistiendo, (c) inconsistencia en el modelo de aislamiento multi-tenant, y (d) abundante código muerto / scripts ad-hoc commiteados. Ninguno bloquea el funcionamiento actual, pero todos elevan el coste de cada cambio y el riesgo de errores.

---

## 2. Mapa de la arquitectura

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| Páginas admin | `app/dashboard/**` | CRUD y gestión por dominio |
| Vista operario | `app/dashboard/today/**` | Vista simplificada del día (cash, clock-in, labels, checklist, requests, deliveries, schedule) |
| Server actions | `app/lib/actions/**` | Mutaciones por dominio |
| Lógica de negocio | `app/lib/*.ts` | costing, production, shopping-list, smart-shopping, pos, units, definitions |
| Componentes UI | `app/ui/**` | Formularios, tablas, navegación |
| Infraestructura | `lib/**` (raíz de web) | prisma, auth/location, storage/spaces, push/send, reports/kpi, week |
| Datos | `prisma/schema.prisma` | ~60 modelos |

---

## 3. Duplicidades encontradas

### 3.1 🔴 "Mundo Obrador" paralelo al catálogo principal *(prioridad alta)*

El módulo **Obrador** reimplementa entidades que ya existen en el núcleo, en lugar de reutilizarlas. Esto crea **dos fuentes de verdad** para producto, receta, coste y venta.

| Núcleo (existente) | Obrador (reimplementado) | Solapamiento |
|---|---|---|
| `Recipe`, `RecipeItem`, `RecipeStep`, `RecipeStepIngredient` | `ObradorRecipe`, `ObradorRecipeIngredient` | Receta + ingredientes |
| `Ingredient`, `MasterProduct`, `SupplierProduct`, `PurchaseFormat` | `ObradorProduct` | Definición de producto |
| Alérgenos/dietas en `Recipe` (`isVegan`, `isGlutenFree`, `allergens`…) | `allergens`, `isAdditive` en `ObradorRecipeIngredient` | Gestión de alérgenos |
| `SalesRecord`, `MenuService`, `MenuServiceItem` | `ObradorSale` | Registro de ventas |
| `costing.ts` (cálculo de coste de receta) | `totalCost` / `cost` recalculados en Obrador | Costeo |
| `StorageLocation` / almacén | `ObradorRawMaterialEntry` (recepción materia prima) | Entrada de stock |

**Impacto:** un cambio de precio de proveedor, un alérgeno nuevo o una corrección de coste deben aplicarse en dos sitios. Divergencia garantizada con el tiempo.

**Modelos Obrador implicados:** `ObradorConfig`, `ObradorProduct`, `ObradorRecipe`, `ObradorRecipeIngredient`, `ObradorRawMaterialEntry`, `ObradorProductionBatch`, `ObradorBatchIngredient`, `ObradorCustomer`, `ObradorSale`, `ObradorTemperatureLog`, `ObradorCleaningTask`, `ObradorCleaningLog`, `ObradorIncident`, `ObradorSanitaryDocument`.

> Nota: parte de Obrador (trazabilidad sanitaria, lotes, temperaturas, incidencias APPCC) **sí es legítimamente específico** y no debería fusionarse. La duplicación está en producto/receta/coste/venta, no en el cumplimiento sanitario.

### 3.2 🔴 Tres sistemas de "tareas" coexistiendo *(prioridad alta)*

Tres modelos distintos resuelven el mismo concepto base ("asignar trabajo a alguien y verificar su cumplimiento"):

1. **`Task`** — producción ligada a recetas/eventos (`assignedTo`, `status`, `plannedStart/End`, `recipe`, `targetQuantity`).
2. **`ChecklistTemplate` + `ChecklistField` + `ChecklistSchedule` + `ChecklistInstance` + `ChecklistResponse`** — el "corazón" según el roadmap (checklists recurrentes con campos tipados, fotos, frecuencias).
3. **`MiseEnPlaceTask`** — mise en place / timbre, ligado a `Recipe` y estaciones.

Cada uno tiene su propia UI (`/tasks`, `/tasks/templates`, `/tasks/schedules`, `/mise-en-place`, `/today/checklist`) y sus propias server actions. No comparten estado, asignación ni reporting.

**Impacto:** funcionalidad de asignación/seguimiento triplicada; informes fragmentados; curva de aprendizaje alta para el usuario.

### 3.3 🟠 Doble sistema de etiquetas

- Núcleo: modelo `ProductLabel` + `/dashboard/labels` + `/dashboard/today/labels` + `app/lib/actions/product-labels.ts`.
- Obrador: `/dashboard/obrador/labeling/preview` + `app/lib/timbre/*` (presets, validación, tipos).

Dos generadores de etiquetas independientes con formatos y lógica propios.

### 3.4 🟠 Inconsistencia de *scoping* multi-tenant *(riesgo de seguridad)*

Conviven **dos estrategias de aislamiento de datos** sin un criterio documentado:

- **Por `ownerId`** (→ `User`): `AppConfig`, `Event`, `Supplier`, `Task`, `MiseEnPlaceTask`, `MenuService`, `PurchaseOrder`, `ObradorSanitaryDocument`, `StorageLocation`, y otros.
- **Por `locationId`** (→ `Location`): `ChecklistTemplate`, `ChecklistSchedule`, `Communication`, `ClockIn`, `Shift`, `ProductLabel`, `CashClosing`, `FinancialEntry`.

**Impacto:** cada query debe recordar por cuál de los dos campos filtrar. Un olvido = **fuga de datos entre tenants/locales**. Es la duplicidad con mayor riesgo real, aunque no sea visible para el usuario.

### 3.5 🟡 Dos lógicas de compra solapadas

- `app/lib/shopping-list.ts` → `generateShoppingList(eventId)` — lista de la compra por evento.
- `app/lib/smart-shopping.ts` → `calculateSmartShoppingList(startDate, endDate)` — lista por rango de fechas.

Conceptos solapados (explosionar recetas → ingredientes → cantidades a comprar) con dos implementaciones.

### 3.6 🟡 Dos carpetas de utilidades `lib`

- `app/lib/` (lógica de app + actions)
- `lib/` en la raíz de `apps/web` (infraestructura)

La separación no es del todo nítida (p. ej. `app/lib/pos.ts` vs `lib/reports/kpi.ts`). Conviene un criterio único.

### 3.7 🔵 Código muerto y scripts ad-hoc commiteados *(limpieza inmediata)*

**7 scripts casi idénticos en la raíz de `apps/web`** — todos hacen variantes de `prisma.user.findMany()`:
`check_permissions.js`, `check_users.js`, `debug_users.js`, `find_client_users.js`, `get_users_detailed.js`, `list_all_users.js`, `reproduce_sidenav.js`.

**Duplicación dentro de `scripts/`:**
- `ensure-gerencia.ts` + `ensure_gerencia_local.js` + `fix_local_gerencia.js` (mismo objetivo: asegurar usuario gerencia).
- `list-users.ts` + `list_all_users.js` (raíz).
- Scripts de depuración puntual: `debug-404.ts`, `debug-jordan.ts`, `reset-jordan.ts`, `reproduce-worker-login.ts`, `check-sync.ts`.

**Artefactos que no deberían estar en git:**
- `prisma/dev.db` (SQLite, ~trackeado) — producción usa PostgreSQL.
- `prisma/schema.prisma.backup` — copia de seguridad manual del esquema.

El `.gitignore` no excluye ninguno de los dos.

---

## 4. Facilidad funcional (UX)

1. **Navegación con entradas redundantes.** En `nav-links.ts`, "Compras" (`/dashboard/purchasing`) y "Pedidos a proveedores" (`/dashboard/purchasing/orders`) son dos entradas del menú hacia el mismo módulo, que **ya tiene pestañas internas** (`PurchasingTabs`). Además "Productos", "Almacén" e "Inventario" representan tres conceptos de stock con fronteras difusas para el usuario.

2. **`today/*` duplica el admin como código, no como vista.** La vista operario (cash, clock-in, labels, requests, checklist) es una buena idea de producto, pero hoy está implementada como páginas duplicadas en lugar de componentes compartidos parametrizados por rol/permiso. Mantener ambas obliga a corregir cada bug dos veces.

3. **Sin tests automatizados ni CI.** No hay carpeta de tests. El flujo se apoya en `.bat` de Windows (`TEST.bat`, `DESPLEGAR.bat`, `Iniciar App.bat`), lo que ata el desarrollo a una máquina concreta.

4. **Deuda técnica visible en el esquema.** El modelo `Ingredient` contiene comentarios de incertidumbre sin resolver (varias líneas debatiendo si Prisma soporta JSON en SQLite, con campos `allergens` y `allergensJson` redundantes). Indica decisiones a medio tomar.

5. **Tres conceptos de "tarea" para el usuario final.** Derivado de §3.2: el operario y el supervisor deben aprender tres flujos distintos (Tareas, Checklists, Mise en place) para gestionar el trabajo del día.

---

## 5. Plan de mejora propuesto (por fases)

Diseñado para ser **incremental y reversible**: cada fase es un PR pequeño y revisable, ordenado de menor a mayor riesgo. No se ejecuta nada sin aprobación previa.

### Fase 0 — Limpieza sin riesgo *(rápido · alto valor · cero cambio funcional)*
- Eliminar los 7 scripts ad-hoc de la raíz de `apps/web`.
- Consolidar `scripts/` en un único `scripts/admin.ts` con subcomandos (`list-users`, `ensure-gerencia`, etc.) y borrar los duplicados/depuración puntual.
- Sacar `prisma/dev.db` y `prisma/schema.prisma.backup` del control de versiones y añadirlos a `.gitignore`.
- Limpiar comentarios obsoletos y el campo redundante `allergens`/`allergensJson` en `Ingredient` (si no se usa).
- **Done:** repo más limpio, sin scripts duplicados, sin artefactos binarios; build y app intactos.

### Fase 1 — Auditoría y unificación del *scoping* multi-tenant *(seguridad · prioridad alta)*
- Inventariar modelo por modelo qué usa `ownerId` vs `locationId` y por qué.
- Definir UNA estrategia objetivo (recomendación: `locationId` como unidad de aislamiento, con `ownerId` solo donde aplique propiedad individual).
- Crear un helper central (`lib/auth/scope.ts`) que toda query de lectura/escritura use para filtrar por tenant/local, evitando olvidos.
- **Done:** estrategia documentada + helper aplicado en los dominios críticos; tests de no-fuga entre locales.

### Fase 2 — Consolidación de duplicidades de código *(refactor de bajo riesgo)*
- Fusionar `shopping-list.ts` + `smart-shopping.ts` en un único módulo con una API que cubra "por evento" y "por rango".
- Extraer la vista `today/*` a componentes compartidos con el admin, parametrizados por rol/permiso.
- Unificar el criterio `app/lib/` vs `lib/` (infra en `lib/`, dominio en `app/lib/`).
- Simplificar la navegación redundante (fusionar entradas "Compras"/"Pedidos").
- **Done:** menos código, una sola fuente por función; UX de navegación más clara.

### Fase 3 — Convergencia de datos *(gran decisión arquitectónica)*
- **Obrador ↔ núcleo:** plan de migración para que `ObradorProduct`/`ObradorRecipe`/`ObradorSale` referencien las entidades del núcleo (`MasterProduct`/`Recipe`/`SalesRecord`), conservando lo genuinamente específico (trazabilidad APPCC, lotes, temperaturas, incidencias). Migración de datos con script idempotente + período de convivencia.
- **Tres sistemas de tareas:** decidir entre (a) unificar todo bajo el modelo Checklist, o (b) mantener separados con una base común de asignación/seguimiento. Requiere decisión de producto.
- **Done:** una sola fuente de verdad para producto/receta/coste/venta; estrategia de tareas acordada.

---

## 6. Decisiones que requieren al usuario

1. **Obrador:** ¿es una unidad de negocio independiente (justifica datos separados) o debe converger con el catálogo principal?
2. **Tareas:** ¿se unifican los tres sistemas bajo Checklists, o se mantienen separados con base común?
3. **Scoping:** ¿la unidad de aislamiento objetivo es `Location` (local) o `User`/tenant (owner)?
4. **Vista operario (`today`):** ¿se mantiene como experiencia separada (recomendado) reutilizando componentes, o se integra en el admin con permisos?

---

## 7. Referencias rápidas

- Esquema de datos: `apps/web/prisma/schema.prisma`
- Navegación: `apps/web/app/ui/dashboard/nav-links.ts`
- Server actions: `apps/web/app/lib/actions/**`
- Lógica de negocio: `apps/web/app/lib/{costing,production,shopping-list,smart-shopping,pos,units}.ts`
- Infraestructura: `apps/web/lib/**`
- Scripts ad-hoc a limpiar: raíz de `apps/web/*.js` y `apps/web/scripts/**`
- Documentación de producto previa: `docs/yurest-analysis.md`, `docs/yurest-roadmap-completo-futuro.md`, `docs/yurest-tasks-mvp.md`
