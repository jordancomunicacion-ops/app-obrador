'use client';

import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BeakerIcon,
  TagIcon,
  UserIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import {
  createObradorBatch,
  type ObradorBatchFormState,
} from '@/app/lib/actions/obrador-production';

type ProductOption = { id: string; name: string; shelfLifeDays: number | null };
type CustomerOption = { id: string; name: string; customerType: string | null };

function localDateTimeNow(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function addDaysISO(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ObradorProductionForm({
  products,
  customers,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
}) {
  const [state, formAction] = useActionState<ObradorBatchFormState, FormData>(createObradorBatch, {
    message: null,
    errors: {},
  });

  const [productId, setProductId] = useState('');
  const [productionDate, setProductionDate] = useState(localDateTimeNow());
  const [expiryDate, setExpiryDate] = useState('');

  const selected = products.find((p) => p.id === productId);
  const datePart = productionDate
    ? new Date(productionDate)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')
    : 'YYYYMMDD';
  const prodPart = selected
    ? selected.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'PROD'
    : 'PROD';
  const batchPreview = `L-${datePart}-${prodPart}-NNN`;

  useEffect(() => {
    if (selected && productionDate) {
      setExpiryDate(addDaysISO(productionDate, selected.shelfLifeDays ?? 3));
    }
  }, [productId, productionDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fieldCls = 'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/obrador/production"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BeakerIcon className="w-8 h-8 text-emerald-600" />
            Nueva Producción
          </h1>
          <p className="text-slate-600 mt-1">Registra una nueva elaboración y su lote.</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
          No hay productos de obrador todavía. Crea uno en{' '}
          <Link href="/dashboard/products/packaged/create" className="font-bold underline">
            Productos
          </Link>{' '}
          antes de iniciar una producción.
        </div>
      ) : (
        <form action={formAction} className="space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-emerald-600" />
              Identificación del Lote
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelCls}>Producto a Elaborar</label>
                <select
                  name="masterProductId"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className={fieldCls}
                >
                  <option value="">Selecciona un producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {state.errors?.masterProductId && (
                  <p className="mt-1 text-sm text-rose-600">{state.errors.masterProductId[0]}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Código de Lote (automático)</label>
                <input
                  type="text"
                  value={batchPreview}
                  readOnly
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className={labelCls}>Fecha y Hora de Producción</label>
                <input
                  name="productionDate"
                  type="datetime-local"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>Cantidad Producida</label>
                <div className="flex gap-2">
                  <input
                    name="quantityProduced"
                    type="number"
                    step="0.01"
                    className={fieldCls}
                    placeholder="Ej. 25.5"
                  />
                  <select name="unit" defaultValue="kg" className="px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="kg">kg</option>
                    <option value="uds">uds</option>
                    <option value="l">l</option>
                  </select>
                </div>
                {state.errors?.quantityProduced && (
                  <p className="mt-1 text-sm text-rose-600">{state.errors.quantityProduced[0]}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Fecha de Caducidad</label>
                <input
                  name="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-rose-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Operario Responsable</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    name="operatorName"
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                    placeholder="Nombre del operario"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Destino (Cliente / Punto de venta)</label>
                <select name="customerId" defaultValue="" className={fieldCls}>
                  <option value="">Sin asignar</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.customerType ? ` · ${c.customerType}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Mermas (opcional)</label>
                <input
                  name="wasteQuantity"
                  type="number"
                  step="0.01"
                  className={fieldCls}
                  placeholder="Kg perdidos"
                />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select name="status" defaultValue="abierto" className={fieldCls}>
                  <option value="abierto">Abierto</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="bloqueado">Bloqueado</option>
                  <option value="retirado">Retirado</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Observaciones</label>
                <textarea
                  name="observations"
                  rows={3}
                  className={fieldCls}
                  placeholder="Cualquier incidencia o detalle de la producción..."
                />
              </div>
            </div>
          </div>

          {state.message && <p className="text-sm text-rose-600 font-medium">{state.message}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <Link
              href="/dashboard/obrador/production"
              className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
            >
              <CheckIcon className="w-5 h-5" />
              Guardar Lote
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
