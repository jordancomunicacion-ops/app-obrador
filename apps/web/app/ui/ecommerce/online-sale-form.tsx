'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { BuildingStorefrontIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { updateOnlineSale, type OnlineSaleFormState } from '@/app/lib/actions/ecommerce';

export type OnlineSaleInitial = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  isSellableOnline: boolean;
  salePrice: number | null;
  onlineDescription: string | null;
  onlineImageUrl: string | null;
  legalDenomination: string | null;
  allergens: string | null;
};

export default function OnlineSaleForm({ initial }: { initial: OnlineSaleInitial }) {
  const action = updateOnlineSale.bind(null, initial.id);
  const [state, formAction] = useActionState<OnlineSaleFormState, FormData>(action, {
    message: null,
  });

  const field = 'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/ecommerce/products"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BuildingStorefrontIcon className="w-8 h-8 text-emerald-600" />
            Venta online: {initial.name}
          </h1>
          <p className="text-slate-600 mt-1">
            {initial.category || 'Sin categoría'}
            {initial.legalDenomination ? ` · ${initial.legalDenomination}` : ''}
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isSellableOnline"
              defaultChecked={initial.isSellableOnline}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-semibold text-slate-900">Disponible en la tienda web</span>
          </label>

          <div>
            <label className={labelCls}>Precio de venta (€, IVA incl.)</label>
            <input
              name="salePrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial.salePrice ?? ''}
              className={field}
              placeholder="Ej. 24.90"
            />
          </div>

          <div>
            <label className={labelCls}>Descripción comercial (tienda)</label>
            <textarea
              name="onlineDescription"
              rows={3}
              defaultValue={initial.onlineDescription ?? ''}
              className={field}
              placeholder={initial.description ?? 'Texto atractivo para la tienda…'}
            />
            <p className="mt-1 text-xs text-slate-400">
              Si lo dejas vacío se usa la descripción genérica del producto.
            </p>
          </div>

          <div>
            <label className={labelCls}>URL de la imagen de venta</label>
            <input
              name="onlineImageUrl"
              type="url"
              defaultValue={initial.onlineImageUrl ?? ''}
              className={field}
              placeholder="https://…"
            />
          </div>

          {initial.allergens && (
            <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-800">
              <strong>Alérgenos (de la ficha):</strong> {initial.allergens}
            </div>
          )}
        </div>

        {state.error && <p className="text-sm text-rose-600 font-medium">{state.error}</p>}

        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/ecommerce/products"
            className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
