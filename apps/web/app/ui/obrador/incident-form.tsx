'use client';

import { useActionState, useEffect, useRef } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { createIncident, type IncidentFormState } from '@/app/lib/actions/obrador-compliance';

const TYPES = ['Producto', 'Temperatura', 'Limpieza', 'Plaga', 'Proveedor', 'Otro'];

export default function IncidentForm() {
  const [state, formAction] = useActionState<IncidentFormState, FormData>(createIncident, {
    message: null,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const fieldCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500';
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1 uppercase';

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Nueva Incidencia</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tipo</label>
          <select name="type" defaultValue={TYPES[0]} className={fieldCls}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Operario</label>
          <input name="operatorName" type="text" className={fieldCls} placeholder="Nombre" />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Descripción</label>
          <textarea name="description" rows={2} className={fieldCls} placeholder="Qué ha ocurrido..." />
          {state.errors?.description && (
            <p className="mt-1 text-xs text-rose-600">{state.errors.description[0]}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Acción Correctiva</label>
          <input name="correctiveAction" type="text" className={fieldCls} placeholder="Opcional" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        {state.message ? (
          <p className={`text-sm font-medium ${state.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {state.message}
          </p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          className="px-5 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-all flex items-center gap-1"
        >
          <PlusIcon className="w-5 h-5" />
          Registrar Incidencia
        </button>
      </div>
    </form>
  );
}
