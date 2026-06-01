# Bloque C — Inteligencia gastronómica (Sapiens + química molecular)

> Arranque del Bloque C del roadmap (`docs/arquitectura-objetivo-y-roadmap.md`).
> **Estado: a la espera de datos del usuario.** No se implementa esquema todavía,
> a propósito (ver §4): modelar el árbol sin el libro sería especular y arriesgar
> un re-trabajo como el del revert #22.

## 0. Pre-requisitos cumplidos
- ✅ Bloque A (organización) y Frente A (Obrador → núcleo) completos.
- ✅ Frente B (Opción B): vista y reporting unificados.
- ✅ Catálogo y recetario unificados → base sobre la que monta el Bloque C.

## 1. Objetivo
Que una **taxonomía Sapiens (elBulli)** sea la clasificación transversal de
productos y recetas, y que un **perfil químico-molecular por producto** permita
**predecir perfiles aromáticos** de recetas y **sugerir maridajes**.

## 2. Punto de partida en el código (semilla)
- `MasterProduct.sapiensWorld` y `SupplierProduct.sapiensWorld` son **texto libre**
  hoy (valores tipo "Reino Animal / Vegetal / Fungi / Mundo Mineral").
- Se usan en los formularios de producto (`app/ui/products/*`) y en la ficha.
- **Plan:** promover ese texto libre a una **taxonomía de primera clase** (tablas),
  conservando el valor actual como dato a migrar (additivo, sin pérdida).

## 3. Diseño propuesto (a confirmar con el libro)

### 3.1 Capa taxonomía (Fase 5 del roadmap)
Entidades de primera clase, hijas de un árbol configurable:
```
SapiensNode            ← nodo genérico del árbol (auto-referencia parentId)
  - level: MUNDO | REINO | FAMILIA | ...   (niveles del libro)
  - name, code, parentId, order
ProductSapiens         ← M:N MasterProduct ↔ SapiensNode (un producto, varios nodos)
```
Alternativa (si el árbol es estricto y de profundidad fija): tablas por nivel
(`SapiensWorld` → `SapiensKingdom` → `SapiensFamily`…). **La elección depende de
si el árbol del libro tiene profundidad fija o variable.**

También de primera clase (roadmap §3): **Técnicas**, **Herramientas**, **Métodos**
de elaboración → se vinculan a `Recipe`/`RecipeStep`.

### 3.2 Capa química molecular (Fase 6 del roadmap)
```
Compound               ← compuesto aromático (nombre, familia olfativa, umbral…)
ProductCompound        ← M:N MasterProduct ↔ Compound (concentración/intensidad)
```
- **Predicción de perfil aromático** de una receta = agregación de los compuestos
  de sus productos, ponderada por cantidad y **modificada por el método** (cocción,
  fermentación…) → motor de cálculo sobre `Recipe` + `Transformation`.
- **Maridajes** = productos/recetas con compuestos compartidos.

### 3.3 Migración (additiva, como todo el rediseño)
1. Crear tablas de taxonomía/química **junto a** `sapiensWorld` (no se borra nada).
2. Sembrar los nodos desde el libro; backfill de `sapiensWorld` → nodo equivalente.
3. Conmutar los formularios de producto al selector de árbol.
4. Deprecar `sapiensWorld` (texto) cuando todo apunte a la taxonomía.

## 4. Lo que necesito de ti (bloqueante) 📌
Para no construir el esquema equivocado, necesito del **libro Sapiens** y de los
**libros de química**:

**Taxonomía Sapiens**
1. **Niveles del árbol** y su orden (p. ej. Mundo → Reino → Familia → …). ¿Profundidad fija o variable?
2. Un **ejemplo completo** de rama (de la raíz a la hoja) para 2-3 productos reales.
3. ¿Un producto puede colgar de **varios** nodos a la vez? (define M:N vs 1:N)
4. ¿Se clasifican también **recetas**, o solo productos?
5. Listas de **Técnicas / Herramientas / Métodos** (aunque sea un primer subconjunto).

**Química molecular**
6. ¿Qué **datos por compuesto** hay en tus libros? (nombre, familia olfativa, umbral de
   percepción, concentración por producto…). Un par de ejemplos reales.
7. ¿La predicción de aromas se basa en **compuestos compartidos** (estilo foodpairing)
   o en un modelo propio que ya tengas definido?

## 5. Próximo paso
En cuanto pases (1)-(5) de §4, diseño el esquema concreto de la taxonomía y
arranco la **Fase 5** por pasos (tablas → seed → selector → backfill), igual que
el resto del rediseño. La química (Fase 6) va después, con (6)-(7).
