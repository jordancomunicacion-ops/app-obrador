import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeftIcon, MapPinIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import { ORDER_STATUS_META } from '@/app/ui/ecommerce/order-status';
import OrderStatusActions from '@/app/ui/ecommerce/order-status-actions';
import type { OnlineOrderStatus } from '@/app/lib/actions/ecommerce';

export default async function OnlineOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const order = await prisma.onlineOrder.findFirst({
    where: { id, ...(await locationScope()) },
    include: { items: true, customer: { select: { id: true, name: true } } },
  });

  if (!order) notFound();

  const status = order.status as OnlineOrderStatus;
  const meta = ORDER_STATUS_META[status];
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(d);

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/ecommerce/orders"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 font-mono">{order.reference}</h1>
          <p className="text-slate-500 mt-1">{fmtDate(order.createdAt)}</p>
        </div>
        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase ${meta?.badge ?? 'bg-slate-100 text-slate-500'}`}>
          {meta?.label ?? status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Artículos */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Artículos</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-5 py-3 text-slate-900">{it.productName}</td>
                  <td className="px-5 py-3 text-slate-500 text-center">x{it.quantity}</td>
                  <td className="px-5 py-3 text-right text-slate-900">
                    {(it.priceAtPurchase * it.quantity).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td className="px-5 py-3 font-bold text-slate-900" colSpan={2}>
                  Total
                </td>
                <td className="px-5 py-3 text-right font-bold text-lg text-slate-900">
                  {order.total.toFixed(2)} €
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Cliente / envío */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-slate-900">Cliente y envío</h2>
          <p className="font-medium text-slate-900">{order.customerName}</p>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <EnvelopeIcon className="w-4 h-4 text-slate-400" />
              {order.customerEmail}
            </div>
            {order.phone && (
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-slate-400" />
                {order.phone}
              </div>
            )}
            {(order.address || order.city) && (
              <div className="flex items-start gap-2">
                <MapPinIcon className="w-4 h-4 text-slate-400 mt-0.5" />
                <span>
                  {order.address}
                  {order.address && <br />}
                  {[order.zipCode, order.city].filter(Boolean).join(' ')}
                </span>
              </div>
            )}
          </div>
          {order.notes && (
            <div className="bg-amber-50 p-2 rounded text-xs text-amber-800">{order.notes}</div>
          )}
          {order.customer && (
            <Link
              href={`/dashboard/settings/customers/${order.customer.id}/edit`}
              className="text-emerald-600 text-sm font-bold hover:underline inline-block"
            >
              Ver en CRM →
            </Link>
          )}
        </div>
      </div>

      {/* Acciones de estado */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-bold text-slate-900 mb-4">Gestión del pedido</h2>
        <OrderStatusActions orderId={order.id} status={status} />
      </div>
    </div>
  );
}
