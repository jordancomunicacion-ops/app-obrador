'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BeakerIcon, TagIcon, TruckIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  updateOnlineOrderStatus,
  startOrderProduction,
  generateOrderLabels,
  type OnlineOrderStatus,
  type OrderActionResult,
} from '@/app/lib/actions/ecommerce';
import { ORDER_STATUS_META } from '@/app/ui/ecommerce/order-status';

export default function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OnlineOrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const run = (fn: () => Promise<OrderActionResult>) =>
    startTransition(async () => {
      const res = await fn();
      setMsg({ text: res.ok ? res.message ?? 'Hecho.' : res.error ?? 'Error.', ok: res.ok });
      if (res.ok) router.refresh();
    });

  const isFinal = status === 'DELIVERED' || status === 'CANCELLED';

  // Acción primaria según el estado actual.
  const primary = (() => {
    switch (status) {
      case 'NEW':
        return {
          label: 'Iniciar producción',
          icon: BeakerIcon,
          onClick: () => run(() => startOrderProduction(orderId)),
        };
      case 'IN_PRODUCTION':
        return {
          label: 'Generar etiquetas de venta',
          icon: TagIcon,
          onClick: () => run(() => generateOrderLabels(orderId)),
        };
      case 'LABELED':
        return {
          label: 'Marcar como Enviado',
          icon: TruckIcon,
          onClick: () => run(() => updateOnlineOrderStatus(orderId, 'SHIPPED')),
        };
      case 'SHIPPED':
        return {
          label: 'Marcar como Entregado',
          icon: CheckIcon,
          onClick: () => run(() => updateOnlineOrderStatus(orderId, 'DELIVERED')),
        };
      default:
        return null;
    }
  })();

  if (isFinal) {
    return (
      <div>
        <p className="text-sm text-slate-500">
          Pedido {ORDER_STATUS_META[status].label.toLowerCase()}. No hay más acciones.
        </p>
        {msg && <FeedBack msg={msg} />}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {primary && (
          <button
            disabled={pending}
            onClick={primary.onClick}
            className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <primary.icon className="w-5 h-5" />
            {pending ? 'Procesando…' : primary.label}
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => {
            if (confirm('¿Cancelar este pedido?')) run(() => updateOnlineOrderStatus(orderId, 'CANCELLED'));
          }}
          className="px-5 py-2.5 border border-rose-300 text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <XMarkIcon className="w-5 h-5" />
          Cancelar
        </button>
      </div>
      {msg && <FeedBack msg={msg} />}
    </div>
  );
}

function FeedBack({ msg }: { msg: { text: string; ok: boolean } }) {
  return (
    <p className={`mt-3 text-sm font-medium ${msg.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
      {msg.text}
    </p>
  );
}
