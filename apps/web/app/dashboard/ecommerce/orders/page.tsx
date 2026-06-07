import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import { ORDER_STATUS_META } from '@/app/ui/ecommerce/order-status';
import type { OnlineOrderStatus } from '@/app/lib/actions/ecommerce';

export default async function EcommerceOrdersPage() {
  const orders = await prisma.onlineOrder.findMany({
    where: { ...(await locationScope()) },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      reference: true,
      status: true,
      customerName: true,
      city: true,
      total: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(d);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <ShoppingCartIcon className="w-8 h-8 text-emerald-600" />
          Pedidos online
        </h1>
        <p className="text-slate-600 mt-1">
          Pedidos pagados que llegan de la tienda web. Inicia producción, etiqueta y marca el envío.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <ShoppingCartIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">Aún no hay pedidos online.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left text-xs uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Referencia</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const meta = ORDER_STATUS_META[o.status as OnlineOrderStatus];
                return (
                  <tr key={o.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/ecommerce/orders/${o.id}`}
                        className="font-mono font-bold text-emerald-700 hover:underline"
                      >
                        {o.reference}
                      </Link>
                      <div className="text-xs text-slate-400">{o._count.items} art.</div>
                    </td>
                    <td className="px-5 py-3 text-slate-900">
                      {o.customerName}
                      {o.city && <div className="text-xs text-slate-400">{o.city}</div>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(o.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${meta?.badge ?? 'bg-slate-100 text-slate-500'}`}>
                        {meta?.label ?? o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">
                      {o.total.toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
