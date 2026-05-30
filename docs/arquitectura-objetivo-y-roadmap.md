# Arquitectura objetivo y roadmap — `app-cocina`

> Documento de visión y secuenciación (no implica cambios de código).
> Acompaña a `docs/analisis-app-duplicidades-plan.md`.
> Fecha: 2026-05-30 · Rama: `claude/app-analysis-dedup-plan-PKRlR`

---

## 1. Visión (el "norte")

La app debe converger en un sistema donde **una capa de taxonomía Sapiens (elBulli)** es la columna vertebral de la que beben productos, recetarios, producción, obrador y tareas; enriquecida con un **perfil químico-molecular por producto** que permita **predecir perfiles aromáticos** de las recetas según método de elaboración y mezcla de productos. El personal recibe y ejecuta tareas medidas en tiempo, y el **fichaje** procede de un **lector de huella físico** cuyos datos consumen tanto cocina como la app de contabilidad existente.

### Principios de diseño
1. **Una sola fuente de verdad** por concepto (producto, receta, coste, venta, tarea).
2. **Taxonomía Sapiens transversal**: todo se clasifica con el mismo árbol.
3. **Obrador y producción consumen el núcleo**, no lo reimplementan; solo añaden lo que les es propio (registro sanitario, lotes).
4. **Un único motor de tareas/checklists**: unas creadas a mano, otras autogeneradas.
5. **Integración, no silos**: fichaje y contabilidad comparten datos vía una fuente común.

---

## 2. Decisiones confirmadas por el usuario

| Tema | Decisión |
|---|---|
| **Taxonomía Sapiens** | El usuario tiene el libro. Se modelará a partir de él. **Es la tarea más extensa → se aborda al FINAL, tras organizar el resto de la app.** |
| **Química molecular / aromas** | El usuario tiene varios libros. Las lógicas (compuestos, maridajes, predicción de perfiles) se construirán a partir de ese conocimiento. **También al final**, junto con la taxonomía. |
| **Registro de jornada** | Habrá un **aparato físico con lector de huella dactilar** que registra y envía los datos. De esa fuente **beben cocina y contabilidad**. |
| **Contabilidad** | **Ya existe** como app separada en `contabilidad.sotodelprior.com`. El cálculo de variables vive allí; cocina aporta tiempos. |
| **Obrador** | No es un mundo paralelo: **consume** catálogo/recetas del núcleo y añade registro sanitario + venta por lotes. |

---

## 3. Arquitectura objetivo (capas)

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA SAPIENS (al final)                                      │
│  Taxonomías: Mundos/Reinos · Familias · Técnicas ·            │
│  Herramientas · Métodos          + Química molecular/aromas   │
└───────────────┬───────────────────────────────┬──────────────┘
                │ clasifica                       │ enriquece
        ┌───────▼────────┐               ┌────────▼─────────┐
        │  CATÁLOGO       │               │  RECETARIO        │
        │  Productos /    │──ingredientes▶│  Recetas /        │
        │  materias primas│               │  elaboraciones    │
        │  (+ test        │               │  (por herramientas│
        │   carnicero)    │               │   y métodos)      │
        └───────┬─────────┘               └────────┬──────────┘
                │ escandallo / coste               │
        ┌───────▼──────────────────────────────────▼──────────┐
        │  PRODUCCIÓN  →  genera TAREAS  →  OBRADOR (sanitario, │
        │  (planifica, escandalla)         lotes, venta)        │
        └───────┬───────────────────────────────────────────────┘
                │ asigna
        ┌───────▼─────────────┐     ┌───────────────────────────┐
        │  MOTOR DE TAREAS    │     │  PERSONAL                  │
        │  (manual + auto)    │────▶│  ejecución + seguimiento   │
        └─────────────────────┘     └───────────┬───────────────┘
                                                 │ tiempos de tarea
        ┌────────────────────────────────────────▼──────────────┐
        │  FICHAJE (lector de huella físico)                     │
        │     ├──▶ cocina (tiempos, analítica)                   │
        │     └──▶ contabilidad.sotodelprior.com (variables)     │
        └────────────────────────────────────────────────────────┘
```

---

## 4. Cómo la visión resuelve las duplicidades del análisis

| Hallazgo (ver análisis §3) | Resolución en la arquitectura objetivo |
|---|---|
| 3 sistemas de tareas (`Task`, `Checklist*`, `MiseEnPlaceTask`) | **Un motor único**; el origen (manual / producción / escandallo / test carnicero) es un atributo, no un modelo aparte |
| "Mundo Obrador" paralelo | Obrador **referencia** núcleo (`Recipe`/`MasterProduct`/ventas) y solo añade trazabilidad sanitaria y lotes |
| Catálogo difuso (productos/inventario/almacén) | **Taxonomía Sapiens** como clasificación única y transversal |
| Doble compra/costeo | Escandallo único + test carnicero (`Transformation`) como fuente de mermas/coste |
| Doble etiquetado | Generador único alimentado por catálogo + lotes de obrador |
| Scoping `ownerId` vs `locationId` | Estrategia única de aislamiento (Fase 1) |

---

## 5. Roadmap re-secuenciado

> Orden acordado: **organizar primero, taxonomía/química al final.**
> Cada fase = PR pequeño y revisable. Nada se implementa sin aprobación.

### 🟢 Bloque A — Organizar la app (primero)

**Fase 0 — Limpieza sin riesgo**
Borrar scripts ad-hoc duplicados, sacar `dev.db`/`schema.prisma.backup` de git, unificar carpetas `lib`, limpiar deuda visible del esquema. Cero cambio funcional.

**Fase 1 — Scoping multi-tenant**
Auditar `ownerId` vs `locationId`, definir estrategia única y helper central de aislamiento. (Seguridad.)

**Fase 2 — Consolidar duplicidades de código**
Fusionar `shopping-list`/`smart-shopping`, compartir componentes `today/*` ↔ admin, simplificar navegación redundante.

**Fase 3 — Convergencia de datos (el grueso de "organizar")**
- **Motor de tareas único**: unificar `Task` + `Checklist*` + `MiseEnPlaceTask` bajo un modelo común con `origen` (manual / producción / escandallo / test carnicero) y `estado/seguimiento`.
- **Obrador consume núcleo**: migrar `ObradorProduct`/`ObradorRecipe`/`ObradorSale` a referenciar `MasterProduct`/`Recipe`/ventas del núcleo; conservar trazabilidad sanitaria, lotes y venta por lote.
- Migraciones idempotentes + período de convivencia.

### 🟡 Bloque B — Personal y tiempos

**Fase 4 — Fichaje por huella + integración contabilidad**
- Definir un **endpoint de ingesta** que reciba los registros del lector de huella físico (fuente de verdad del fichaje).
- Vincular cada registro al perfil del empleado; medir **tiempos de fichaje** y **tiempos de ejecución de tareas/elaboraciones**.
- **Exportar/compartir** esos datos con `contabilidad.sotodelprior.com` para el cálculo de variables (definir contrato de integración: API o export).
- Analítica de seguimiento de tareas por empleado en cocina.

### 🔴 Bloque C — Inteligencia gastronómica (al final, la tarea más extensa)

**Fase 5 — Taxonomía Sapiens (elBulli)**
A partir del libro del usuario: modelar mundos/reinos, familias, técnicas, herramientas y métodos como entidades de primera clase. Reclasificar productos y recetas; recetarios "beben" de la taxonomía; elaboraciones gestionadas por herramientas y métodos. (Aprovecha el campo existente `SupplierProduct.sapiensWorld` como semilla.)

**Fase 6 — Química molecular y perfiles aromáticos**
A partir de los libros del usuario: perfil molecular/compuestos por producto; motor de predicción de perfiles aromáticos de recetas según método de elaboración y mezcla; sugerencia de maridajes por compuestos compartidos.

---

## 6. Cuestiones abiertas (para más adelante, no bloquean el Bloque A)

1. **Lector de huella**: modelo/protocolo del aparato (cómo envía los datos: push HTTP, fichero, SDK del fabricante). Determina el endpoint de ingesta.
2. **Contrato con contabilidad**: ¿`contabilidad.sotodelprior.com` expone API para recibir tiempos, o cocina expone los datos y contabilidad los consume? ¿Identidad de empleado compartida entre ambas apps?
3. **Taxonomía Sapiens**: estructura concreta del árbol del libro (para diseñar las tablas en la Fase 5).
4. **Química molecular**: qué libros y qué datos por compuesto (para diseñar el modelo en la Fase 6).

---

## 7. Próximo paso sugerido

Empezar por la **Fase 0** (limpieza segura y reversible) en un PR independiente, y a partir de ahí avanzar por el Bloque A. La taxonomía y la química quedan reservadas para el final, como pediste.
