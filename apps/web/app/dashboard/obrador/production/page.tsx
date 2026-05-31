import Link from 'next/link';
import {
  BeakerIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import DeleteObradorBatch from '@/app/ui/obrador/delete-batch';

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const STATUS_CLS: Record<string, string> = {
  abierto: 'bg-emerald-100 text-emerald-700',
  cerrado: 'bg-slate-100 text-slate-600',
  bloqueado: 'bg-amber-100 text-amber-700',
  retirado: 'bg-rose-100 text-rose-700',
};

export default async function ObradorProductionPage() {
  const session = await auth();
  const ownerId = session?.user?.id ?? '__none__';

  const batches = await prisma.obradorProductionBatch.findMany({
    where: { ownerId },
    include: {
      masterProduct: { select: { name: true } },
      customer: { select: { name: true } },
    },
    orderBy: { productionDate: 'desc' },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayBatches = batches.filter((b) => new Date(b.productionDate) >= todayStart);
  const totalToday = todayBatches.reduce((sum, b) => sum + b.quantityProduced, 0);
  const wasteToday = todayBatches.reduce((sum, b) => sum + (b.wasteQuantity ?? 0), 0);
  const operators = new Set(
    batches.map((b) => b.operatorName).filter((n): n is string => !!n),
  ).size;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BeakerIcon className="w-8 h-8 text-emerald-600" />
            Producción y Lotes
          </h1>
          <p className="text-slate-600 mt-1">
            Registro de producciones diarias y control de trazabilidad.
          </p>
        </div>
        <Link
          href="/dashboard/obrador/production/create"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Iniciar Nueva Producción
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lotes hoy</p>
          <p className="text-2xl font-extrabold text-slate-900">{todayBatches.length}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Producción hoy</p>
          <p className="text-2xl font-extrabold text-emerald-700">
            {totalToday.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
          </p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-sm">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Mermas hoy</p>
          <p className="text-2xl font-extrabold text-rose-700">
            {wasteToday.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operarios</p>
          <p className="text-2xl font-extrabold text-slate-900">{operators}</p>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <BeakerIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            Aún no hay lotes. Inicia el primero con “Iniciar Nueva Producción”.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Código de Lote</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Destino</th>
                  <th className="px-6 py-4">Fecha Producción</th>
                  <th className="px-6 py-4">Caducidad</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4">Responsable</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-emerald-700">
                        {batch.batchCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {batch.masterProduct?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {batch.customer?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        {fmtDate(batch.productionDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-rose-600">
                      {fmtDate(batch.expiryDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {batch.quantityProduced} {batch.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        {batch.operatorName ?? '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          STATUS_CLS[batch.status] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/obrador/labeling/preview?batchId=${batch.id}`}
                          className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Imprimir etiqueta"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                            />
                          </svg>
                        </Link>
                        <DeleteObradorBatch id={batch.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
