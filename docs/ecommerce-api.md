# API de Ecommerce (puente web ↔ obrador)

La tienda web (`WEB SOTOdelPRIOR`) es solo escaparate + cobro (Stripe). El obrador
es la **fuente de verdad** del catálogo y los pedidos. La integración va por la
**clave de API por local** (`IntegrationApiKey`), la misma que ya usa el CRM.

- **Auth**: cabecera `x-api-key: <clave>` o `Authorization: Bearer <clave>`.
- La clave resuelve a un **`Location`**, y cada endpoint opera solo sobre ese
  local → multi-restaurante sin datos cruzados.
- Generar/rotar la clave: Obrador → Ajustes → Integración (por local).

> Nota: esta clave nació como "solo lectura" (tareas/empleados para el CRM).
> Con ecommerce pasa a permitir también **crear pedidos** del propio local
> (`POST /orders`). El alcance sigue acotado al local de la clave.

---

## GET /api/integrations/catalog

Catálogo vendible online del local: `MasterProduct` con `isSellableOnline = true`.
Reutiliza la ficha legal/alérgenos de `ProductSanitaryInfo`.

Respuesta:
```json
{
  "locationId": "clxxx",
  "count": 2,
  "products": [
    {
      "id": "clprod1",
      "name": "Pack hamburguesas de buey",
      "category": "PACK_CARNE",
      "description": "4 hamburguesas de 180g…",
      "price": 24.9,
      "imageUrl": "https://cdn…/pack.jpg",
      "legalDenomination": "Preparado de carne de vacuno",
      "allergens": "—",
      "conservation": "Refrigerado",
      "saleFormat": "bandeja",
      "defaultWeight": 720,
      "requiresCooking": true,
      "updatedAt": "2026-06-07T10:00:00.000Z"
    }
  ]
}
```

## POST /api/integrations/orders

La web reenvía aquí el pedido **ya pagado**. El obrador lo registra como
`OnlineOrder` (estado `NEW`) y hace upsert del `Customer` en el CRM del local.

**Idempotente por `paymentRef`** (PaymentIntent de Stripe): un reintento devuelve
el pedido existente (200) en vez de duplicarlo.

Body:
```json
{
  "paymentRef": "pi_3Q…",
  "total": 49.8,
  "customerName": "Ana López",
  "customerEmail": "ana@example.com",
  "phone": "600000000",
  "address": "C/ Mayor 1",
  "city": "Zaragoza",
  "zipCode": "50001",
  "notes": "Dejar en conserjería",
  "items": [
    { "masterProductId": "clprod1", "productName": "Pack hamburguesas", "quantity": 2, "priceAtPurchase": 24.9 }
  ]
}
```

Respuestas:
- `201` → `{ "ok": true, "order": { "id", "reference": "WEB-YYYYMMDD-NNN", "status": "NEW" } }`
- `200` → `{ "ok": true, "idempotent": true, "order": {…} }` (pago ya registrado)
- `400` → datos inválidos o producto que no pertenece al local
- `401` → clave de API ausente o inválida

### Validaciones
- `masterProductId` (si se envía) debe pertenecer al local de la clave.
- `priceAtPurchase`/`total` se guardan tal cual los cobró la web (Stripe ya validó
  precios en servidor en `WEB/api/checkout`); el obrador registra fielmente.
