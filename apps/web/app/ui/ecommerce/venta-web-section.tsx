'use client';

import { useActionState, useState } from 'react';
import { CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import ImageUpload from '@/app/ui/settings/image-upload';
import {
  updateOnlineSale,
  uploadEcommerceImage,
  type OnlineSaleFormState,
} from '@/app/lib/actions/ecommerce';
import { SHOP_CATEGORIES } from '@/app/lib/ecommerce-constants';

export type VentaWebProduct = {
  id: string;
  name: string;
  description: string | null;
  isSellableOnline: boolean;
  salePrice: number | null;
  onlineDescription: string | null;
  onlineImageUrl: string | null;
  onlineCategory: string | null;
};

export default function VentaWebSection({ product }: { product: VentaWebProduct }) {
  const action = updateOnlineSale.bind(null, product.id);
  const [state, formAction] = useActionState<OnlineSaleFormState, FormData>(action, {
    message: null,
  });
  const [enabled, setEnabled] = useState(product.isSellableOnline);
  const [imageUrl, setImageUrl] = useState(product.onlineImageUrl ?? '');

  const field =
    'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl">
      <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
        <GlobeAltIcon className="w-5 h-5 text-emerald-600" />
        Venta web
      </h2>
      <p className="text-sm text-slate-500 mb-5">
        Activa la venta en la tienda online. Solo los productos con venta activada aparecen en
        Ecommerce → Productos online y en la web.
      </p>

      <form action={formAction} className="space-y-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isSellableOnline"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="font-semibold text-slate-900">A la venta en la web</span>
        </label>

        {enabled && (
          <div className="space-y-5 pl-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Precio de venta (€, IVA incl.)</label>
                <input
                  name="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product.salePrice ?? ''}
                  className={field}
                  placeholder="Ej. 24.90"
                />
              </div>
              <div>
                <label className={labelCls}>Categoría de la tienda</label>
                <select
                  name="onlineCategory"
                  defaultValue={product.onlineCategory ?? ''}
                  className={field}
                >
                  <option value="">— Sin categoría —</option>
                  {SHOP_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Descripción comercial (tienda)</label>
              <textarea
                name="onlineDescription"
                rows={3}
                defaultValue={product.onlineDescription ?? ''}
                className={field}
                placeholder={product.description ?? 'Texto atractivo para la tienda…'}
              />
              <p className="mt-1 text-xs text-slate-400">
                Si lo dejas vacío se usa la descripción genérica del producto.
              </p>
            </div>

            <div>
              <label className={labelCls}>Imagen de venta</label>
              <ImageUpload
                currentImage={imageUrl || null}
                onUpload={async (fd) => {
                  const r = await uploadEcommerceImage(fd);
                  if (r.imageUrl) setImageUrl(r.imageUrl);
                  return r;
                }}
                label="Subir imagen"
                shape="square"
                alt={product.name}
              />
            </div>
          </div>
        )}

        {/* Siempre presente para que el valor viaje aunque se oculte la sección. */}
        <input type="hidden" name="onlineImageUrl" value={imageUrl} />

        {state.error && <p className="text-sm text-rose-600 font-medium">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-700 font-medium">{state.message}</p>}

        <button
          type="submit"
          className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-2"
        >
          <CheckIcon className="w-5 h-5" />
          Guardar venta web
        </button>
      </form>
    </div>
  );
}
