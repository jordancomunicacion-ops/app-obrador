'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { updateOnlineOrderStatus, type OnlineOrderStatus } from '@/app/lib/actions/ecommerce';
import { ORDER_STATUS_META, NEXT_STATUS } from '@/app/ui/ecommerce/order-status';

export default function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OnlineOrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const next = NEXT_STATUS[status];
  const isFinal = status === 'DELIVERED' || status === 'CANCELLED';

  const move = (to: OnlineOrderStatus) =>
    startTransition(async () => {
      const res = await updateOnlineOrderStatus(orderId, to);
      if (res.ok) router.refresh();
      else alert(res.error ?? 'No se pudo actualizar el pedido.');
    });

  if (isFinal) {
    return (
      <p className="text-sm text-slate-500">
        Pedido {ORDER_STATUS_META[status].label.toLowerCase()}. No hay más acciones.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {next && (
        <button
          disabled={pending}
          onClick={() => move(next)}
          className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <CheckIcon className="w-5 h-5" />
          Marcar como {ORDER_STATUS_META[next].label}
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => {
          if (confirm('¿Cancelar este pedido?')) move('CANCELLED');
        }}
        className="px-5 py-2.5 border border-rose-300 text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-all flex items-center gap-2 disabled:opacity-50"
      >
        <XMarkIcon className="w-5 h-5" />
        Cancelar
      </button>
    </div>
  );
}
