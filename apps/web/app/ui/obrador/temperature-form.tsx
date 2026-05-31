'use client';

import { useActionState, useEffect, useRef } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import {
  createTemperatureLog,
  type TemperatureFormState,
} from '@/app/lib/actions/obrador-compliance';

export default function TemperatureForm() {
  const [state, formAction] = useActionState<TemperatureFormState, FormData>(createTemperatureLog, {
    message: null,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const fieldCls = 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1 uppercase';

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Nuevo Registro de Temperatura</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className={labelCls}>Equipo</label>
          <input name="equipmentName" type="text" className={fieldCls} placeholder="Ej. Cámara 1" />
          {state.errors?.equipmentName && (
            <p className="mt-1 text-xs text-rose-600">{state.errors.equipmentName[0]}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Temperatura (ºC)</label>
          <input name="temperature" type="number" step="0.1" className={fieldCls} placeholder="2.5" />
          {state.errors?.temperature && (
            <p className="mt-1 text-xs text-rose-600">{state.errors.temperature[0]}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Operario</label>
          <input name="operatorName" type="text" className={fieldCls} placeholder="Nombre" />
        </div>
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
          >
            <PlusIcon className="w-5 h-5" />
            Registrar
          </button>
        </div>
        <div className="md:col-span-4">
          <label className={labelCls}>Acción Correctiva (si hubo desviación)</label>
          <input
            name="correctiveAction"
            type="text"
            className={fieldCls}
            placeholder="Opcional — si se rellena, se marca como incidencia"
          />
        </div>
      </div>
      {state.message && (
        <p className={`mt-3 text-sm font-medium ${state.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
