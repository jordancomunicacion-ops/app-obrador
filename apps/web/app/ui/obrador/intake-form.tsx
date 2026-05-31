'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArchiveBoxIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  createObradorIntake,
  type ObradorIntakeFormState,
} from '@/app/lib/actions/obrador-intake';

type SupplierOption = { id: string; name: string };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ObradorIntakeForm({ suppliers }: { suppliers: SupplierOption[] }) {
  const [state, formAction] = useActionState<ObradorIntakeFormState, FormData>(createObradorIntake, {
    message: null,
    errors: {},
  });

  // Sincroniza el nombre del proveedor con el seleccionado (permite también texto manual).
  const [supplierName, setSupplierName] = useState('');

  const fieldCls = 'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/obrador/intake"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ArchiveBoxIcon className="w-8 h-8 text-emerald-600" />
            Registrar Entrada
          </h1>
          <p className="text-slate-600 mt-1">Recepción y control de calidad de materia prima.</p>
        </div>
      </div>

      <form
        action={formAction}
        className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Proveedor</label>
            {suppliers.length > 0 ? (
              <select
                name="supplierId"
                className={fieldCls}
                onChange={(e) => {
                  const opt = suppliers.find((s) => s.id === e.target.value);
                  setSupplierName(opt?.name ?? '');
                }}
              >
                <option value="">— Manual —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div>
            <label className={labelCls}>Nombre del Proveedor</label>
            <input
              name="supplierName"
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className={fieldCls}
              placeholder="Ej. Cárnicas Pepe"
            />
            {state.errors?.supplierName && (
              <p className="mt-1 text-sm text-rose-600">{state.errors.supplierName[0]}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Producto Recibido</label>
            <input
              name="productName"
              type="text"
              className={fieldCls}
              placeholder="Ej. Solomillo Ternera"
            />
            {state.errors?.productName && (
              <p className="mt-1 text-sm text-rose-600">{state.errors.productName[0]}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Lote del Proveedor</label>
            <input name="supplierBatch" type="text" className={fieldCls} placeholder="Ej. L-4455" />
          </div>
          <div>
            <label className={labelCls}>Fecha de Recepción</label>
            <input name="receptionDate" type="date" defaultValue={todayISO()} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Fecha de Caducidad</label>
            <input name="expiryDate" type="date" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Cantidad</label>
            <div className="flex gap-2">
              <input
                name="quantityReceived"
                type="number"
                step="0.01"
                className={fieldCls}
                placeholder="Ej. 15"
              />
              <select name="unit" defaultValue="kg" className="px-3 py-2 border border-slate-300 rounded-lg">
                <option value="kg">kg</option>
                <option value="uds">uds</option>
                <option value="l">l</option>
              </select>
            </div>
            {state.errors?.quantityReceived && (
              <p className="mt-1 text-sm text-rose-600">{state.errors.quantityReceived[0]}</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Temperatura Recepción (ºC)</label>
            <input
              name="receptionTemp"
              type="number"
              step="0.1"
              className={fieldCls}
              placeholder="Ej. 2.5 (vacío si ambiente)"
            />
          </div>
          <div>
            <label className={labelCls}>Estado Visual</label>
            <input
              name="visualStatus"
              type="text"
              className={fieldCls}
              placeholder="Ej. Correcto"
            />
          </div>
          <div>
            <label className={labelCls}>¿Apto?</label>
            <select name="isApto" defaultValue="si" className={fieldCls}>
              <option value="si">Apto</option>
              <option value="no">No apto</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Observaciones</label>
            <textarea name="observations" rows={2} className={fieldCls} />
          </div>
        </div>

        {state.message && <p className="text-sm text-rose-600 font-medium">{state.message}</p>}

        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/obrador/intake"
            className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            Guardar Entrada
          </button>
        </div>
      </form>
    </div>
  );
}
