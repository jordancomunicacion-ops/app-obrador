import type { OnlineOrderStatus } from '@/app/lib/actions/ecommerce';

/** Metadatos de presentación y flujo de cada estado del pedido online. */
export const ORDER_STATUS_META: Record<
  OnlineOrderStatus,
  { label: string; badge: string }
> = {
  NEW: { label: 'Nuevo', badge: 'bg-blue-50 text-blue-700' },
  IN_PRODUCTION: { label: 'En producción', badge: 'bg-amber-50 text-amber-700' },
  LABELED: { label: 'Etiquetado', badge: 'bg-indigo-50 text-indigo-700' },
  SHIPPED: { label: 'Enviado', badge: 'bg-purple-50 text-purple-700' },
  DELIVERED: { label: 'Entregado', badge: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelado', badge: 'bg-rose-50 text-rose-700' },
};

/** Siguiente estado natural del flujo (null si es final). */
export const NEXT_STATUS: Partial<Record<OnlineOrderStatus, OnlineOrderStatus>> = {
  NEW: 'IN_PRODUCTION',
  IN_PRODUCTION: 'LABELED',
  LABELED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};
