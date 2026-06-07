// Categorías de la TIENDA web (independientes de la categoría interna de cocina).
// Las experiencias/visitas quedan fuera de la tienda por ahora.
export const SHOP_CATEGORIES = [
  { value: 'PACK_CARNE', label: 'Packs de carne' },
  { value: 'EMBUTIDO', label: 'Embutidos' },
  { value: 'LICOR', label: 'Licores' },
  { value: 'OTROS', label: 'Otros' },
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number]['value'];

export const SHOP_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  SHOP_CATEGORIES.map((c) => [c.value, c.label]),
);

export const SHOP_CATEGORY_ORDER: string[] = SHOP_CATEGORIES.map((c) => c.value);
