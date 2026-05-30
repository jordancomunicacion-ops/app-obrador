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
| Scoping `ownerId` vs `locationId` | Jerarquía única **Tenant → Empresa → Local** (Fase 1, §8) |

---

## 5. Roadmap re-secuenciado

> Orden acordado: **organizar primero, taxonomía/química al final.**
> Cada fase = PR pequeño y revisable. Nada se implementa sin aprobación.

### 🟢 Bloque A — Organizar la app (primero)

**Fase 0 — Limpieza sin riesgo**
Borrar scripts ad-hoc duplicados, sacar `dev.db`/`schema.prisma.backup` de git, unificar carpetas `lib`, limpiar deuda visible del esquema. Cero cambio funcional.

**Fase 1 — Jerarquía Tenant → Empresa → Local (aislamiento completo)** *(ver §8 para el detalle)*
Introducir el nivel **Empresa** (empleador legal), colgar `Location` de la empresa, extender el eje **Local** a TODAS las operaciones (recetario, catálogo, proveedores, obrador, eventos, tareas…), y modelar el **empleo como contrato por empresa**. Helper central de aislamiento. (Seguridad + cumplimiento legal.)

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

---

## 8. Modelo de aislamiento: Tenant → Empresa → Local *(detalle de la Fase 1)*

### 8.1 Estado actual (diagnóstico)
- **Eje cliente/Org** (funciona): `currentOrgId()` en `auth.ts` resuelve el tenant — un `ADMIN` *es* el cliente; un `USER` hereda el cliente vía `adminId`. La mayoría del catálogo se filtra por `ownerId == org`.
- **Eje local** (incompleto): solo **9 modelos** tienen `locationId` (checklists, comunicaciones, fichajes, turnos, etiquetas, cierres de caja, finanzas). Selector de local activo por cookie (`currentLocationId()` en `lib/auth/location.ts`).
- **Consecuencia**: recetario, catálogo, proveedores, eventos, tareas, obrador y los **empleados** NO se acotan por local; los empleados se cuelgan del cliente vía `adminId`.

### 8.2 Jerarquía objetivo
```
Plataforma (propietario)          — VE TODO: cross-tenant (mismo patrón que CRM/reservas/ganadería)
   └── Cuenta de cliente (tenant) — quien contrata la app (hoy: ADMIN)
          └── Empresa             — empleador legal (razón social + NIF)
                 └── Local / centro de trabajo
                        └── operaciones — recetario, catálogo, proveedores, obrador, caja...
```
Un cliente puede agrupar **varias empresas**; cada empresa, **varios locales**.

**Caso simple (cliente = empresa).** La `Empresa` **siempre existe** como entidad (es el empleador legal con NIF), pero cuando el cliente tiene una sola empresa, la UI **colapsa** el nivel: el alta crea automáticamente cuenta + 1 empresa + local(es) y el usuario nunca ve el nivel "empresa" explícito. Solo cuando hay **más de una empresa** (varios NIF bajo la misma cuenta) aparece el selector de empresa. Ventaja: un único modelo de datos sirve para ambos escenarios; la diferencia es solo de presentación.

### 8.3 Reglas de aislamiento (decisiones confirmadas)

| Entidad | Ámbito |
|---|---|
| Recetario / catálogo (recetas, ingredientes, productos) | **Por local** |
| Proveedores | **Por local** |
| Obrador (producción, lotes, sanitario, venta) | **Por local** |
| Eventos, tareas, pedidos | **Por local** |
| Checklists, comunicaciones, etiquetas | **Por local** (ya lo son) |
| Fichajes, turnos, caja, finanzas | **Por local** (ya lo son) |
| Empleados (personas) | **Por empresa** vía contrato (ver §8.4) |

### 8.4 Empleo y cumplimiento legal *(clave)*
- El empleo se modela como **relación contrato empleado ↔ empresa**, no como una propiedad simple del `User`.
- Un empleado puede asignarse a **varios locales de SU empresa** (misma razón social → legal).
- Para trabajar en locales de **otra empresa**, necesita un **contrato adicional** con esa empresa (segundo registro de empleo). La asignación cruzada sin contrato es **imposible por diseño**, evitando representar una cesión ilegal de trabajadores (Art. 43 ET).
- **Cambio de modelo**: sustituir `User.adminId` / `User.locationId` planos por una entidad de **empleo/contrato** (`empleado`, `empresa`, fechas, tipo) + asignación empleado↔local dentro del marco de esa empresa.

### 8.4-bis Rol de plataforma (propietario) — acceso global
- Mismo patrón multi-tenant que CRM / reservas / ganadería: por encima del tenant hay un **propietario de plataforma** que ve **todos** los clientes, empresas, locales y datos.
- **Estado actual**: existe a medias como email hardcodeado `gerencia@sotodelprior.com`, comprobado de forma dispersa en `app/lib/actions.ts`, `app/ui/employees/table.tsx`, `app/dashboard/employees/page.tsx`, `app/dashboard/system/users/page.tsx` y `auth.ts`. **No tiene vista real cross-tenant**: `currentOrgId()` lo acota a su propia org; el acceso global está parcheado caso a caso.
- **Objetivo**: rol de primera clase (`SUPERADMIN`/`PLATFORM`) en vez de email hardcodeado; el helper de aislamiento le concede lectura **cross-tenant** (salta el filtro por org); consolidar todos los checks de `gerencia@…` en un único punto.

### 8.5 Implicaciones técnicas (Fase 1)
1. Nuevo modelo **`Empresa`** (razón social, NIF, domicilio…). Semilla aprovechable: `ObradorConfig.companyName`/`nif`.
2. `Location.empresaId` → cada local pertenece a una empresa (la empresa pertenece al tenant).
3. Entidad de **empleo/contrato** que reemplace el `adminId`/`locationId` plano; soporte de multi-contrato por persona.
4. Añadir `locationId` (o derivado vía empleo) a las entidades que hoy solo tienen `ownerId`: recetas, ingredientes, productos, proveedores, eventos, tareas, obrador.
5. **Helper central de aislamiento** que toda query use para filtrar por tenant → empresa → local, evitando olvidos; con bypass cross-tenant para el rol de plataforma.
6. **Rol `SUPERADMIN`/`PLATFORM`** que reemplace el email hardcodeado `gerencia@sotodelprior.com` (ver §8.4-bis).
7. Migración idempotente del modelo actual (`ownerId`-only) al nuevo, con período de convivencia.
