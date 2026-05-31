# Plan de reorganización y deduplicación (Administración / Obrador)

Objetivo: eliminar duplicados de interfaz/navegación entre **Obrador** y **Administración**,
recolocar secciones según su naturaleza y reducir el hub de Obrador a lo puramente productivo.

## Decisiones tomadas
- **Obrador se mantiene reducido**: conserva *Entrada de materia prima*, *Producción y lotes* y
  *Etiquetado*. El resto sale a su sección natural.
- **Clientes y puntos de venta → Administración**, y **se crea el vínculo lote→destino**
  (`ObradorProductionBatch.customerId` + selector en el formulario de producción).
- Despliegue real por `prisma db push` (no migraciones versionadas). Los cambios de schema se
  aplican solos; las migraciones de **datos** requieren un paso de backfill puntual.

## Hallazgos clave (qué está duplicado de verdad)
- **Proveedores**: modelo único `Supplier`. La gestión completa estaba en Obrador; en `settings`
  había acciones mínimas sin página (UI muerta). → Unificación de UI, sin migración.
- **Productos**: modelo único `MasterProduct` + bandera `isObrador` + ficha 1:1
  `ProductSanitaryInfo`. Dos formularios para la misma tabla. → Unificación de UI, sin migración.
- **Establecimiento**: modelos DISTINTOS (`ObradorConfig` singleton vs `Location` multi-local;
  además `Empresa`). → Dedup real con cambio de schema + migración de datos + repuntar etiquetas.
- **Clientes ↔ lotes**: no existe vínculo de datos hoy. → Funcionalidad nueva.

## Fases (un PR por tema, orden de riesgo)
1. **Proveedores → Administración** (`/dashboard/settings/suppliers`). 🟢 Sin migración. ✅ hecho (#27)
2. **Productos → Catálogo**: una sola lista de Productos con tipo "No elaborado / Elaborado"; el
   formulario de elaborado (ficha sanitaria) se conserva detrás. + Sapiens (Mundo/Reino) en todos
   los productos. 🟡 ✅ hecho (#27)
3. **Controles sanitarios → Operaciones** + **Documentación y Aviso legal → Administración**.
   🟢 Reagrupación de menú (las rutas se mantienen bajo `/obrador`). ✅ hecho (#27)
4. **Clientes y PdV → Administración + vínculo lote→destino**. 🟡 Schema additivo + UI. ✅ hecho (#27)
   (incluye columna "Destino" en la lista de Producción y Lotes).
5. **Establecimiento → Locales**: añadir campos sanitarios/fiscales a `Location`, migrar datos de
   `ObradorConfig`, repuntar etiquetas, actualizar UI de Locales, eliminar la pestaña del obrador.
   🔴 Requiere backfill de datos (script puntual).

## Mejoras futuras (anotadas, fuera del alcance inicial)
- Vínculo **Entrada de materia prima ↔ Compras/Pedidos** (hoy no conectados como datos).
- Vínculo **Producción y lotes ↔ Tareas** (hoy indirecto vía receta/evento).
