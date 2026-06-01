# Plan — Selector de cuentas/empresas (multi-tenant, estilo CRM)

> Objetivo: que el **propietario de plataforma** (`SUPERADMIN`) pueda **cambiar de
> cuenta cliente activa** desde un selector en la barra superior — igual que el
> selector del CRM — y que **toda la app quede acotada a esa cuenta** mientras
> esté seleccionada.
>
> **Estado de implementación:**
> - ✅ **Fases 0-2** (PR #29, mergeado): cookie `active_account_id`, helpers
>   (`account.ts`/`accounts.ts`), scope acotado a la cuenta activa y selector en
>   la barra. Por defecto **"Todas las cuentas"**; visible solo al `SUPERADMIN`.
> - ✅ **Fase 3** (este PR): `currentOrgId()` delega en `currentAccountId()`, de
>   modo que **los ~41 consumidores honran la cuenta activa sin tocarlos**.
> - ✅ **Fase 4 (núcleo)**: fail-closed ya cubierto — con "Todas" el propietario
>   obtiene `orgId = null` y las creaciones/acciones que hacen `if (!orgId) throw`
>   se bloquean solos. Falta solo **QA manual** (matriz al final) y, opcional, un
>   test anti-fuga cross-tenant.

## 1. Contexto: qué hay hoy

La app **ya tiene** una base multi-tenant. No partimos de cero.

| Pieza | Dónde | Estado |
|-------|-------|--------|
| Rol propietario de plataforma | `app/lib/auth/platform.ts` (`isPlatformOwner`, `SUPERADMIN`) | ✅ |
| Frontera de tenant = cuenta (`ownerId`) | 28 modelos llevan `ownerId` | ✅ |
| Resolución de "mi organización" | `auth.ts:92` `currentOrgId()` | ✅ |
| Scope centralizado | `app/lib/auth/scope.ts` (`currentScope`, `locationScope`, `scopedLocationId`) | ✅ |
| Scope de locales | `app/lib/auth/location.ts` (`locationScopeWhere`, `currentLocationId`) | ✅ |
| **Selector de LOCAL** (cookie `active_location_id`) | `app/ui/locations/location-switcher.tsx` + `app/lib/actions/locations.ts:setActiveLocation` | ✅ |

**Jerarquía conceptual ya presente:** Plataforma → Cuenta cliente (`ownerId`/ADMIN)
→ Empresa (`Empresa`) → Local (`Location`).

### El comportamiento actual que queremos cambiar

Hoy, para el propietario de plataforma, `currentScope()` devuelve
`{ kind: "platform" }` ⇒ las consultas **no se filtran** ⇒ ve **los datos de
todos los clientes mezclados**. Y `currentOrgId()` le devuelve `null` (no es
`ADMIN`), por lo que las 41 pantallas/acciones que dependen de `currentOrgId()`
**no tienen una cuenta sobre la que operar**.

**Lo que pediste:** que el propietario **elija una cuenta** y la app se comporte
como esa cuenta (datos aislados), pudiendo cambiar de cuenta cuando quiera.

## 2. Idea central (mínimo cambio, máximo alcance)

Reproducir el patrón del selector de local, un nivel más arriba:

1. **Cookie nueva `active_account_id`** = `ownerId` de la cuenta seleccionada
   (el `id` del usuario `ADMIN` dueño de esa cuenta).
2. Un único helper **`effectiveOrgId()`** que resuelve "la cuenta sobre la que
   opero ahora mismo":
   - Propietario de plataforma → valor de la cookie (validado), o `null` si elige *Todas*.
   - `ADMIN` → su propio `id` (igual que hoy).
   - `USER` → su `adminId` (igual que hoy).
3. **Enrutar el scope a través de ese helper.** Como el aislamiento ya está
   centralizado, basta tocar **3 funciones** para que el cambio se propague a
   las ~44 consultas que ya usan `locationScope()`:
   - `locationScopeWhere()` (en `location.ts`)
   - `currentScope()` (en `scope.ts`)
   - `currentOrgId()` → se complementa con `effectiveOrgId()`

> Clave: hoy `locationScopeWhere()` ya devuelve `{ ownerId }` para un `ADMIN`.
> Si para el propietario **con cuenta activa** devolvemos también
> `{ ownerId: cuentaActiva, isActive: true }`, entonces `listLocations()`,
> `currentLocationId()` y `locationScope()` quedan automáticamente acotadas a
> esa cuenta. **Un cambio pequeño con efecto en cascada.**

## 3. Fases

### Fase 0 — Helper de "cuenta activa" (sin cambio de comportamiento) 🟢
Crear `app/lib/auth/account.ts`:
- `ACCOUNT_COOKIE = "active_account_id"`.
- `listAccounts()`: si es propietario de plataforma, lista las cuentas cliente
  seleccionables = usuarios `role: "ADMIN"` (con `id`, `name`, `email` y, si
  existe, su `Empresa.razonSocial`). Para el resto: solo su propia cuenta.
- `currentAccountId()`: propietario → cookie validada (debe ser un `ADMIN`
  existente) o `null`; `ADMIN` → su `id`; `USER` → `adminId`.
- `effectiveOrgId()`: igual que `currentAccountId()` (alias semántico para uso
  en queries; reemplazará gradualmente a `currentOrgId()`).
- `setActiveAccount(id)` (server action): **solo** propietario de plataforma;
  valida que `id` es un `ADMIN`; setea la cookie; **borra `active_location_id`**
  (porque los locales pertenecen a la cuenta); `revalidatePath("/dashboard")`.

En esta fase nada cambia de comportamiento todavía (nadie llama a los helpers).

### Fase 1 — El scope respeta la cuenta activa 🟡
- `location.ts:locationScopeWhere()`: en la rama del propietario de plataforma,
  si hay cuenta activa ⇒ `{ ownerId: cuentaActiva, isActive: true }`; si no
  (opción *Todas*) ⇒ `{ isActive: true }` (comportamiento actual).
- `scope.ts:currentScope()`: el propietario **con** cuenta activa pasa a
  comportarse como `kind: "location"` dentro de esa cuenta (no `"platform"`),
  de modo que `locationScope()` filtre por `locationId` igual que un ADMIN.
  Sin cuenta activa, mantiene `kind: "platform"` (ve todo).
- **Decisión de diseño (a confirmar contigo):** ¿el estado por defecto del
  propietario es *Todas las cuentas* (como hoy) o **forzamos elegir una**? Para
  evitar "sopa" de datos cross-tenant, recomiendo **por defecto la primera
  cuenta**, con opción explícita *Todas* solo donde tenga sentido (dashboards
  globales).

### Fase 2 — Selector en la barra superior 🟢
- `app/ui/accounts/account-switcher.tsx` (clon de `location-switcher.tsx`):
  visible **solo** para el propietario de plataforma; al cambiar llama a
  `setActiveAccount` y `router.refresh()`.
- `app/ui/dashboard/topbar.tsx`: renderizar el `AccountSwitcher` **a la
  izquierda** del `LocationSwitcher` (cuenta → local). Cargar `listAccounts()` y
  `currentAccountId()` con `Promise.all`.

### Fase 3 — Migrar consumidores de `currentOrgId()` 🟡
Sustituir `currentOrgId()` por `effectiveOrgId()` en los **41 ficheros** que hoy
dependen de la organización, para que el propietario opere **dentro de la cuenta
elegida** (incluidas las **creaciones**: asignar el `ownerId` correcto al crear
locales, plantillas, comunicaciones, pedidos, etiquetas, etc.).
- Bloques por dominio para revisar/probar de forma incremental:
  comunicaciones, tareas (schedules/templates/supervise/reports), checklists,
  pedidos de compra, etiquetas, locales, menú, "hoy".
- Riesgo: una creación que hoy asume `currentOrgId()` no nulo. Con
  `effectiveOrgId()` el propietario sin cuenta activa daría `null` ⇒ **bloquear
  la acción con mensaje "selecciona una cuenta"** (fail-closed).

### Fase 4 — Endurecimiento y casos límite 🟡
- Al cambiar de cuenta, invalidar el local activo si no pertenece a la nueva
  cuenta (`currentLocationId()` ya revalida contra el scope, pero limpiamos la
  cookie en `setActiveAccount` para evitar parpadeos).
- Fail-closed: propietario con acción que requiere cuenta y sin cuenta activa.
- Auditoría rápida de queries que filtran por `ownerId` **sin** pasar por el
  scope centralizado (las que hoy usan `currentOrgId()` directo) — cubiertas en
  Fase 3.
- Matriz de QA:
  - Propietario sin cuenta → *Todas* (o forzar selección, según Fase 1).
  - Propietario con cuenta A → ve **solo** datos de A; cambia a B → ve solo B.
  - Propietario crea dato con cuenta A → queda con `ownerId = A`.
  - `ADMIN` y `USER` → **sin** selector, comportamiento idéntico al actual.

### Fase 5 — (Opcional, futuro) Empresa dentro de la cuenta 🔴
Este selector opera a nivel **cuenta (`ownerId`)**. Si más adelante quieres un
segundo selector a nivel **`Empresa`** (varias razones sociales dentro de una
misma cuenta), se añade el mismo patrón con cookie `active_empresa_id` y filtro
`empresaId`. **Fuera de alcance de este plan.**

## 4. Ficheros que se tocan (resumen)

**Nuevos**
- `app/lib/auth/account.ts` (helpers + cookie)
- `app/lib/actions/accounts.ts` (`setActiveAccount`)  *(o dentro de `account.ts`)*
- `app/ui/accounts/account-switcher.tsx`

**Modificados (núcleo)**
- `app/lib/auth/location.ts` — rama del propietario en `locationScopeWhere()`
- `app/lib/auth/scope.ts` — `currentScope()` honra la cuenta activa
- `auth.ts` — `currentOrgId()`/`effectiveOrgId()`
- `app/ui/dashboard/topbar.tsx` — montar el selector

**Modificados (Fase 3, incremental)**
- ~41 ficheros que usan `currentOrgId()` (lista en el análisis), por bloques.

## 5. Migración de datos / deploy
- **No requiere `db push`.** Todo el mecanismo es de sesión/cookie + scoping;
  no hay columnas nuevas (`ownerId`, `Empresa`, `Location.empresaId` ya existen).
- Sin backfill: las cuentas seleccionables son los `ADMIN` ya existentes.

## 6. Riesgos
- **Fuga cross-tenant**: el riesgo principal es una consulta que NO pase por el
  scope centralizado. Fase 3 + auditoría de Fase 4 lo cubren; conviene un test
  que, logueado como propietario con cuenta A, asegure que ninguna lista muestre
  `ownerId != A`.
- **Creaciones con `ownerId` incorrecto**: mitigado asignando `effectiveOrgId()`
  en todas las creaciones y bloqueando si es `null`.
- Volumen: 41 ficheros ⇒ se hace por bloques con PR revisable, no en un golpe.

## 7. Decisiones que necesito de ti antes de implementar
1. **Estado por defecto del propietario**: ¿*Todas las cuentas* o **forzar
   elegir una**? (recomiendo forzar/primera cuenta).
2. ¿El selector lo ve **solo** el propietario de plataforma, o también un
   `ADMIN` que gestione varias cuentas? (hoy un `ADMIN` = una cuenta).
3. ¿Implementamos las fases en **PRs separados** (0-2 primero: selector
   funcional acotando lectura; 3-4 después) o todo en uno?
