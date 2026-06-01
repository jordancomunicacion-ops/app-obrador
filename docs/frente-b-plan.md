# Frente B — Motor de tareas único · análisis y plan

> Acompaña a `docs/fase-3-plan-reestructuracion.md` (§B).
>
> **Decisión tomada: Opción B (convergencia pragmática)** — vista de seguimiento
> unificada primero, sin migración de datos.
> **Hecho (1ª entrega):** `/dashboard/tasks/all` ("Todo") — tablero de solo
> lectura que junta PRODUCCIÓN (`Task`) y OPERATIVA (`ChecklistInstance`) del día,
> acotado por local, con navegación por día y enlaces a las pantallas de gestión.
> **Siguiente (B):** reporting unificado de cumplimiento; reconciliar la
> recurrencia de `ProductionRoutine` y `ChecklistSchedule` en una capa común.

## 1. Qué pasó en el intento previo (#22 → #23)

- **#22** borró `MiseEnPlaceTask` por considerarlo *código muerto* (0 referencias a `prisma.miseEnPlaceTask`).
- **#23 lo revirtió**: la premisa era falsa. `MiseEnPlaceTask` **no es código muerto**, es el **andamiaje del motor de mise en place** (envase gastronorm + estación + receta). Le falta *contenido/datos*, no sobra.

**Lección (regla para todo el Frente B):** en esta app *"0 referencias en código" ≠ "borrable"*. Hay **modelos-andamiaje** creados a propósito para funciones futuras. **Nada se borra por estar sin usar**; solo se depreca tras validar que lo nuevo lo sustituye de verdad.

## 2. Estado real hoy (en `main`)

| Modelo | Rol | Uso en código |
|---|---|---|
| `TaskDefinition` / `TaskInstance` / `TaskField` / `TaskSchedule` / `TaskResponse` | **Motor nuevo** (diseño B.2: `family` OPERATIONAL/PRODUCTION + `origin`) | **0 ficheros** → andamiaje sin cablear |
| `Task` | Tareas de producción (modelo viejo) | 7 ficheros (en uso **y en expansión**) |
| `ProductionRoutine` → genera `Task` | **Nuevo** (recurrencia de producción, patrón de `ChecklistSchedule` pero sobre `Task`) | 3 ficheros |
| `ChecklistTemplate` / `Schedule` / `Instance` / `Response` | Checklists operativos (modelo viejo) | 6 / 4 / 10 ficheros (en uso **y en expansión**) |
| `MiseEnPlaceTask` | Andamiaje del motor de mise en place | 0 (intencional, **no tocar**) |

**Conclusión del diagnóstico:**
1. El motor nuevo (`TaskDefinition/TaskInstance`) **nunca se cableó**: sigue siendo esqueleto.
2. El desarrollo **activo en paralelo** (cron de autogeneración, asignación, **ciclos de producción `ProductionRoutine`**) **sigue construyéndose sobre los modelos VIEJOS** (`Task`, `ChecklistInstance`).
3. De hecho, las **dos familias** del plan ya existen funcionalmente, pero **sobre los modelos viejos**:
   - **Operativa** = `ChecklistTemplate/Schedule/Instance/Response` (campos tipados, recurrencia, supervisión, informes).
   - **Producción** = `Task` + `ProductionRoutine` (recurrencia de producción).
   Lo que **no** existe es la **base común única** (`TaskInstance`) por debajo de ambas.

## 3. La tensión que cambia la decisión

El plan original (§B.2) propone unificar todo bajo `TaskDefinition/TaskInstance`. Pero:
- El motor nuevo está **sin usar** y el trabajo nuevo **diverge** de él (añade `ProductionRoutine` sobre `Task` en vez de `TaskSchedule` sobre `TaskDefinition`).
- Un **cutover big-bang** ahora pelearía contra un blanco móvil (mientras migro, entran features nuevas en los modelos viejos) → alto riesgo de churn y conflictos, justo el tipo de fricción del episodio #22.

## 4. Dos estrategias posibles

### Opción A — Unificación completa (el plan §B.2 original) 🔴
Migrar `Task` + `Checklist*` + `ProductionRoutine` a `TaskDefinition/TaskInstance` (base común + familias).
1. **Puente** — ya hecho (los modelos nuevos existen).
2. **Congelar** la divergencia: dejar de añadir features sobre los modelos viejos.
3. **Backfill** idempotente viejo → nuevo (incluido `ProductionRoutine` → `TaskDefinition` PRODUCCIÓN + `TaskSchedule`).
4. **Cutover** de UIs (`/tasks/*`, `/today/*`, supervisión, informes) al motor único.
5. **Deprecar** (no borrar) los modelos viejos tras validar.
- **Pro:** una sola fuente de verdad, reporting unificado, fin de la divergencia.
- **Contra:** el cambio más amplio de la app; requiere parar el desarrollo paralelo de tareas; riesgo alto.

### Opción B — Convergencia pragmática (recomendada para empezar) 🟡
Aceptar que las **dos familias ya viven en los modelos viejos** y entregar el **valor de usuario** (un único lugar para ver/asignar/seguir TODO el trabajo) **sin** migración masiva de datos:
1. **Vista/seguimiento unificado** (solo lectura) sobre `Task` (+`ProductionRoutine`) y `ChecklistInstance`: un tablero/agenda y un reporting que combinan ambas familias, ya acotados por local.
2. **Reconciliar `ProductionRoutine` y `ChecklistSchedule`** conceptualmente (mismo patrón de recurrencia) en una capa de servicio común, sin fusionar tablas todavía.
3. **Retirar el andamiaje no usado** `TaskDefinition/TaskInstance/...` **solo si** decidimos que el camino es B (para no dejar dos diseños compitiendo) — o conservarlo explícitamente documentado como objetivo de A.
- **Pro:** entrega valor ya, riesgo bajo, no choca con el trabajo paralelo.
- **Contra:** no hay base de datos única (la unificación real queda pendiente).

## 5. Recomendación

Dado (a) el revert previo por una limpieza precipitada, (b) que el motor nuevo está sin cablear y (c) que hay **desarrollo activo en paralelo sobre los modelos viejos**, **no es el momento de un cutover big-bang (Opción A)**.

**Recomiendo la Opción B**: empezar por una **vista de seguimiento unificada (solo lectura)** que junte producción + operativa, que es el valor que se busca, sin tocar el modelo de datos ni pelear con el trabajo en curso. La unificación de tablas (A) se reevalúa cuando el diseño de tareas se estabilice y se pueda congelar.

## 6. Decisión que necesito
- ¿Vamos por **A** (unificación completa de modelos, parando el desarrollo paralelo) o por **B** (vista/seguimiento unificado primero, sin migración)?
- Si **B**: ¿retiro el andamiaje `TaskDefinition/TaskInstance` no usado, o lo conservo como objetivo futuro de A?
