# Fase 3 — Plan detallado de reestructuración

> Plan de la "reestructuración" (no implica cambios de código todavía).
> Acompaña a `docs/arquitectura-objetivo-y-roadmap.md`.
> Pre-requisito: aislamiento por local (Fases 0-2) ya en `main` y validado en runtime.

La Fase 3 tiene **dos grandes frentes independientes** que pueden abordarse por separado:

- **A. Convergencia Obrador → núcleo** (eliminar el "mundo paralelo").
- **B. Motor de tareas único** (unificar `Task` + `Checklist*` + `MiseEnPlaceTask`).

Principio rector para ambos: **migración aditiva y reversible** — primero se añade el puente, luego se backfillea, luego se conmuta la lectura, y solo al final se deprecan los modelos viejos. Nada se borra hasta que lo nuevo está validado.

---

## A. Convergencia Obrador → núcleo

### A.1 Diagnóstico (estado en `main`)
Obrador es hoy un vertical paralelo de 14 modelos:
`ObradorConfig, ObradorProduct, ObradorRecipe, ObradorRecipeIngredient, ObradorRawMaterialEntry, ObradorProductionBatch, ObradorBatchIngredient, ObradorCustomer, ObradorSale, ObradorTemperatureLog, ObradorCleaningTask, ObradorCleaningLog, ObradorIncident, ObradorSanitaryDocument`.

De ellos, unos **duplican** el núcleo y otros son **legítimamente propios** del obrador (cumplimiento sanitario/APPCC).

### A.1.1 Principio: ficha de producto ÚNICA *(decisión del usuario)*
Existe **una sola ficha de producto** en el catálogo (`MasterProduct`), y **todas las secciones** (cocina, obrador, recetario, compras, etiquetas…) **beben de ella**. Cero duplicación por secciones. La ficha agrupa, como "pestañas" de un mismo producto:

```
MasterProduct  ← LA ficha única (p.ej. "Solomillo de vaca")  + flag esObrador
  ├─ SupplierProduct[]            ← cada proveedor = una variante (NO un producto nuevo)
  │     └─ Transformation         ← "test carnicero": mermas/rendimientos POR proveedor
  │           └─ outputs → Ingredient   ← lo que se usa en recetas (coste real por proveedor)
  ├─ ProductSanitaryInfo (1:1)    ← sección sanitaria/nutricional/legal (pestaña, no producto aparte)
  └─ (recetas, etiquetas, obrador… referencian ESTE producto)
```

**Cambio de proveedor → no se duplica el producto:** se elige/añade otro `SupplierProduct` con su propio **test carnicero**. La ficha sigue siendo una; el coste y rendimiento se ajustan según el proveedor activo. Esto ya es la arquitectura existente `MasterProduct → SupplierProduct → Transformation`; la convergencia consiste en que **obrador la use también** en vez de su `ObradorProduct` paralelo.

### A.2 Mapa de convergencia

| Obrador (duplica) | Núcleo destino | Acción |
|---|---|---|
| `ObradorProduct` | `MasterProduct` + `ProductSanitaryInfo` (extensión 1:1) | Pasa a ser la **ficha única** con flag `esObrador`; la info legal/nutricional/conservación es la sección `ProductSanitaryInfo` (pestaña de la misma ficha, no producto aparte) |
| `ObradorRecipe` + `ObradorRecipeIngredient` | `Recipe` + `RecipeItem`/`RecipeStep` | Migrar a receta del núcleo; los % y aditivos pasan a `RecipeItem` (+ campo `esAditivo`) |
| `ObradorSale` | `SalesRecord` (+ `MenuService`) | Migrar ventas a `SalesRecord` con referencia a lote |
| `ObradorCustomer` | *(nuevo)* `Customer` del núcleo | Promover a un modelo `Customer` reutilizable (hoy solo existe en obrador) |
| `ObradorRawMaterialEntry` | Recepción de `Supplier`/`SupplierProduct` (compras) | Unificar con el flujo de pedidos/albaranes (`PurchaseOrder`/`DeliveryNote`) |


| Obrador (se CONSERVA — específico APPCC) | Motivo |
|---|---|
| `ObradorConfig` | Datos de registro sanitario del obrador (RGSEAA…) |
| `ObradorProductionBatch` + `ObradorBatchIngredient` | **Lotes de producción** (trazabilidad) — núcleo del valor del obrador |
| `ObradorTemperatureLog` | Registro de temperaturas (APPCC) |
| `ObradorCleaningTask` + `ObradorCleaningLog` | Plan de limpieza (APPCC) → *candidato a fusionar con el motor de tareas, ver Frente B* |
| `ObradorIncident` | Incidencias sanitarias |
| `ObradorSanitaryDocument` | Documentación sanitaria |

> Nota: el "obrador" pasa de ser un módulo aislado a ser **una vista/flujo sobre el núcleo** + una capa de trazabilidad sanitaria y lotes.

### A.3 Estrategia de migración (4 sub-pasos)

1. **Puente (aditivo).** Añadir FKs nullable de los modelos que se conservan hacia el núcleo:
   - `ObradorProductionBatch.recipeId → Recipe`, `.masterProductId → MasterProduct`.
   - `ObradorSale.salesRecordId → SalesRecord` (o migrar a `SalesRecord` con `batchId`).
   - `ObradorBatchIngredient.ingredientId → Ingredient`.
   Sin romper nada: los modelos viejos siguen funcionando.

2. **Backfill (script idempotente).** Por cada `ObradorProduct`/`ObradorRecipe`/`ObradorSale`/`ObradorCustomer` crear su equivalente en el núcleo (con `locationId` correcto) y enlazar. Marcar los originales como `migrated`.

3. **Cutover (lectura).** Las pantallas de obrador pasan a leer del núcleo (productos, recetas, ventas, clientes) y solo mantienen su UI propia para lotes/temperaturas/limpieza/incidencias/documentos.

4. **Deprecación.** Tras validar, eliminar `ObradorProduct/ObradorRecipe/ObradorRecipeIngredient/ObradorSale/ObradorCustomer` y sus rutas. Conservar lo sanitario/lotes ya enlazado al núcleo.

### A.4 Riesgos y mitigación
- **Campos sanitarios**: ✅ resuelto → tabla de extensión `ProductSanitaryInfo` (1:1 con `MasterProduct`), no columnas. Mantiene `MasterProduct` limpio.
- **Pérdida de trazabilidad de lotes**: los lotes NUNCA se tocan; solo ganan FK al núcleo. Riesgo bajo.

### A.5 Criterios de done (Frente A)
- Productos/recetas/ventas/clientes del obrador viven en el núcleo, acotados por local.
- Lotes, temperaturas, limpieza, incidencias y documentos siguen operativos, enlazados al núcleo.
- Cero duplicación producto/receta/venta. Las pantallas de obrador consumen el núcleo.

### A.6 Decisiones (resueltas)
1. ✅ Info sanitaria/nutricional → **tabla de extensión `ProductSanitaryInfo`** (disjunta de `MasterProduct`).
2. ✅ Catálogo → **único con flag `esObrador`** (un producto es el mismo para cocina y obrador; puede ser ambos).
3. ⏳ `ObradorRawMaterialEntry`: pendiente — ¿se unifica con `DeliveryNote`/compras o se conserva como recepción específica con FK a `Supplier`? *(no bloquea el arranque; se decide al llegar a recepción)*

---

## B. Motor de tareas único

### B.1 Diagnóstico (estado en `main`)
Tres sistemas que resuelven "asignar trabajo y verificar cumplimiento":
- **`Task`** — producción ligada a `Recipe`/`Event` (estado, fechas plan/real, asignado).
- **`ChecklistTemplate` + `ChecklistField` + `ChecklistSchedule` + `ChecklistInstance` + `ChecklistResponse`** — checklists recurrentes con campos tipados, fotos, frecuencias, supervisión.
- **`MiseEnPlaceTask`** — mise en place por estación, ligado a `Recipe`.
- *(+ `ObradorCleaningTask`/`Log` del Frente A, que es otro "checklist" de limpieza.)*

### B.2 Dos familias sobre una base común *(refinado con feedback del usuario)*

Las tareas **operativas** y las de **producción** son fundamentalmente distintas y no deben aplanarse en un único tipo. Por tanto: **una base común** + **dos familias especializadas** (decisión B.6.1 = base común + vistas, no unificación total).

| | **Familia OPERATIVA** | **Familia PRODUCCIÓN** |
|---|---|---|
| Disparador | Rutina/recurrencia (turno, día) | Demanda (evento/menú/escandallo) |
| Qué se verifica | Checklist de campos tipados + foto/firma | Cantidad producida de una receta |
| Vínculo | Local / estación / turno | Receta + cantidad + transformaciones |
| Hoy es | `Checklist*` + limpieza obrador | `Task` (producción) + `MiseEnPlace` |
| Ejemplos | Abrir/cerrar local, limpieza, temperaturas, APPCC | Elaborar 8 kg de salsa, mise en place de un servicio |

**Base común** (`TaskInstance`): asignación, estado, local, tiempos plan/real, evidencia/respuestas. Sobre ella, cada familia añade lo suyo:

```
TaskDefinition            (plantilla)
  - family: OPERATIONAL | PRODUCTION        ← distinción primaria
  - origin: MANUAL | CHECKLIST | CLEANING | PRODUCTION | MISE_EN_PLACE  ← subtipo
  - title, description
  // Operativa:
  - fields?: TaskField[]      (tipados: texto, número, foto, check, temperatura…) ← ChecklistField
  - schedule?: TaskSchedule   (frecuencia/recurrencia)                            ← ChecklistSchedule
  - stationId? / shiftId?
  // Producción:
  - recipeId? / eventId? / menuServiceId? / targetQuantity? / unit?

TaskInstance              (una ocurrencia concreta — base común)
  - definitionId, family
  - status: PENDING | IN_PROGRESS | DONE | ISSUE
  - assignedToUserId, plannedStart/End, realStart/End
  - locationId            (aislamiento por local — ya es la norma)
  - responses?: TaskResponse[]   (operativa: valor por campo + foto + supervisión) ← ChecklistResponse
  - producedQuantity?            (producción)
```

Cómo encaja cada sistema actual:
- **Operativas** → `family=OPERATIONAL`:
  - Checklist (`origin=CHECKLIST`) → `fields` + `schedule`.
  - Limpieza obrador (`origin=CLEANING`) → checklist de limpieza (absorbe `ObradorCleaningTask`).
  - Manual operativa (`origin=MANUAL`).
- **Producción** → `family=PRODUCTION`:
  - `Task` actual (`origin=PRODUCTION`) → `recipeId`/`eventId`/`targetQuantity`.
  - Mise en place (`origin=MISE_EN_PLACE`) → `stationId`/`recipeId` (preparación para producción).

> Las UIs se mantienen separadas (Tareas de producción ≠ Checklists operativos), pero comparten **un solo modelo de datos** debajo: misma asignación, mismo seguimiento, reporting unificado.

#### B.2.1 Fuentes/generadores de tareas
El motor recibe tareas desde varias **fuentes**, no solo creación manual (igual que hoy un evento genera tareas de producción):

| Fuente | Genera | Familia |
|---|---|---|
| Evento | Tareas de producción de sus recetas | PRODUCCIÓN |
| Menú / servicio | Tareas de producción | PRODUCCIÓN |
| Lote de obrador | Tareas de elaboración del lote | PRODUCCIÓN |
| **Módulo APPCC** (limpieza, temperaturas) | Tareas operativas/limpieza recurrentes | OPERATIVA |
| Plantilla de checklist + schedule | Instancias operativas por frecuencia | OPERATIVA |
| Manual | Tarea suelta | cualquiera |

Es decir, **desde APPCC se crean tareas** (de limpieza/control) que aterrizan en el mismo motor y se asignan/siguen igual que las de producción. El módulo APPCC sigue siendo el "dueño" de la definición sanitaria, pero la ejecución y el seguimiento viven en el motor de tareas único.

### B.3 Estrategia de migración (aditiva)
1. Crear `TaskDefinition`/`TaskInstance`/`TaskField`/`TaskResponse`/`TaskSchedule` **junto a** los modelos actuales.
2. Backfill: convertir `Task`, `Checklist*`, `MiseEnPlaceTask`, `ObradorCleaningTask` a la nueva estructura (script idempotente).
3. Cutover de las UIs (`/tasks`, `/tasks/templates`, `/tasks/schedules`, `/mise-en-place`, `/today/checklist`, supervisión, reportes) al motor único.
4. Deprecar los modelos antiguos.

### B.4 Riesgos
- **Mayor superficie** (toca tareas, checklists, mise, reportes, supervisión y la vista "hoy"). Es el cambio más amplio de toda la app → conviene hacerlo **después** del Frente A y con la base ya validada.
- Los **reportes** de checklists (cumplimiento, incidencias, operaciones) deben re-mapearse al nuevo modelo sin perder histórico.

### B.5 Criterios de done (Frente B)
- Un único modelo de datos base con dos familias (operativa/producción); origen como subtipo.
- Las UIs de producción y de checklists operativos siguen separadas, pero sobre el mismo modelo.
- Reportes y supervisión unificados y preservados. Aislamiento por local intacto.

### B.6 Decisiones (resueltas)
1. ✅ Base común + dos familias especializadas (operativa vs producción), no unificación plana (ver B.2).
2. ✅ Histórico de `ChecklistResponse` → **se migra entero** al nuevo modelo (volumen pequeño/nulo; preserva reportes sin archivado en frío).
3. ✅ Limpieza del obrador → **motor de tareas** (`family=OPERATIONAL, origin=CLEANING`), **generada desde el módulo APPCC** (ver B.2.1). APPCC define; el motor ejecuta y sigue.

---

## C. Secuenciación recomendada

1. **Validar Fases 0-2 en runtime** (en curso) — pre-requisito.
2. **Frente A (Obrador → núcleo)** primero: menor superficie, alto valor (mata la peor duplicación), y deja el catálogo limpio para…
3. **Frente B (motor de tareas único)**: el más amplio; mejor sobre una base ya convergida.
4. **Bloque C — Taxonomías** (Sapiens + química molecular, de tus libros): se monta sobre el catálogo y recetario ya unificados.

Cada frente, igual que la Fase 1: **commits/PRs pequeños** (puente → backfill → cutover → deprecación), validables por pasos.

## D. Decisiones (estado)
Resueltas con el usuario:
- ✅ Catálogo **único con flag `esObrador`** (no disjunto).
- ✅ Info sanitaria/nutricional en **tabla de extensión `ProductSanitaryInfo`** (disjunta de `MasterProduct`).
- ✅ Tareas: **base común + dos familias** (operativa/producción).
- ✅ Histórico de checklists: **se migra entero**.
- ✅ Limpieza obrador: **en el motor de tareas, generada desde APPCC** (fuentes de tareas, B.2.1).
- ✅ Orden: **Obrador → núcleo primero**, luego motor de tareas, luego taxonomías.

Pendiente (no bloquea el arranque):
- ⏳ `ObradorRawMaterialEntry`: ¿unificar con compras/albaranes o conservar como recepción específica? Se decide al llegar a ese punto del Frente A.

---

## E. Límite cocina ↔ contabilidad (RRHH y finanzas) *(decisión del usuario)*

`contabilidad.sotodelprior.com` es **otra app**. Cocina = **solo cosas de cocina**. RRHH y contabilidad viven en contabilidad, incluida la **ficha completa del empleado**.

**Se van a contabilidad** (hoy en cocina): `ClockIn` (Fichajes), `Shift` (Turnos), `EmployeeRequest` (Solicitudes: vacaciones/bajas), `CashClosing` (Cierres de caja), `FinancialEntry` (Finanzas/EBITDA).

**Fuente común:** el lector de huella físico es la fuente única del fichaje; **de esos datos beben cocina y contabilidad** (cocina solo lo que necesite para analítica de tareas; contabilidad para nóminas/variables).

**Secuenciación (para NO perder datos):**
1. ✅ **Quitar del menú** de cocina (hecho — PR #13). Las rutas siguen por URL; nada borrado.
2. ⏳ **Copiar/adaptar** esos datos y pantallas en `contabilidad.sotodelprior.com` (trabajo en la otra app).
3. ⏳ **Eliminar de cocina** del todo (rutas `/dashboard/{clock-in,shifts,requests,cash,finance}`, sus acciones/UI y los modelos `ClockIn`/`Shift`/`EmployeeRequest`/`CashClosing`/`FinancialEntry`) **solo cuando** el paso 2 esté hecho.

> Mientras tanto, esos modelos siguen en el esquema de cocina (no estorban; solo quedan fuera del menú).

### Pipeline de catálogo (aclaración del usuario)
**Productos → Recetas → Planificación Menú** son un mismo flujo (por eso van juntos en el grupo "Catálogo"):
- **Productos**: ficha única por producto (harina, limón…) con proveedores + test carnicero + **perfiles aromáticos** *(en desarrollo → enlaza con Bloque C química molecular)*.
- **Recetas**: combinan productos según proveedor y perfil aromático; definen cantidades por tarea; sirven para calcular eficiencia de pedidos.
- **Planificación Menú**: usa las recetas para estructurar el menú y **agregar las cantidades totales** necesarias.
