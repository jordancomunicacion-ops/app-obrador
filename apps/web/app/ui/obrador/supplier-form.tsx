'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { TruckIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { type ObradorSupplierFormState } from '@/app/lib/actions/obrador-suppliers';

export type ObradorSupplierInitial = {
  id: string;
  name: string;
  nif: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  productType: string | null;
  healthRegistry: string | null;
};

export default function ObradorSupplierForm({
  action,
  initial,
}: {
  action: (
    prevState: ObradorSupplierFormState,
    formData: FormData,
  ) => Promise<ObradorSupplierFormState>;
  initial?: ObradorSupplierInitial;
}) {
  const [state, formAction] = useActionState<ObradorSupplierFormState, FormData>(action, {
    message: null,
    errors: {},
  });

  const field = 'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/obrador/suppliers"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <TruckIcon className="w-8 h-8 text-emerald-600" />
            {initial ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h1>
          <p className="text-slate-600 mt-1">Proveedor homologado y su registro sanitario.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelCls}>Nombre</label>
            <input
              name="name"
              type="text"
              defaultValue={initial?.name ?? ''}
              className={field}
              placeholder="Ej. Cárnicas Pepe"
            />
            {state.errors?.name && (
              <p className="mt-1 text-sm text-rose-600">{state.errors.name[0]}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>NIF / CIF</label>
            <input name="nif" type="text" defaultValue={initial?.nif ?? ''} className={field} />
          </div>
          <div>
            <label className={labelCls}>Tipo de Producto</label>
            <input
              name="productType"
              type="text"
              defaultValue={initial?.productType ?? ''}
              className={field}
              placeholder="Ej. Carne fresca, Panadería"
            />
          </div>
          <div>
            <label className={labelCls}>Persona de Contacto</label>
            <input
              name="contactPerson"
              type="text"
              defaultValue={initial?.contactPerson ?? ''}
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Teléfono</label>
            <input name="phone" type="text" defaultValue={initial?.phone ?? ''} className={field} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input name="email" type="email" defaultValue={initial?.email ?? ''} className={field} />
          </div>
          <div>
            <label className={labelCls}>Nº Registro Sanitario</label>
            <input
              name="healthRegistry"
              type="text"
              defaultValue={initial?.healthRegistry ?? ''}
              className={field}
              placeholder="Ej. 26.00001/M"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Dirección</label>
            <input
              name="address"
              type="text"
              defaultValue={initial?.address ?? ''}
              className={field}
            />
          </div>
        </div>

        {state.message && <p className="text-sm text-rose-600 font-medium">{state.message}</p>}

        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/obrador/suppliers"
            className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            {initial ? 'Guardar Cambios' : 'Crear Proveedor'}
          </button>
        </div>
      </form>
    </div>
  );
}
