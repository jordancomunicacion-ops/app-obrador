'use client';

import { useActionState, useEffect, useRef } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { createCleaningTask, type CleaningTaskFormState } from '@/app/lib/actions/obrador-cleaning';

const FREQUENCIES = ['Diaria', 'Semanal', 'Mensual', 'Trimestral'];

export default function CleaningTaskForm() {
  const [state, formAction] = useActionState<CleaningTaskFormState, FormData>(createCleaningTask, {
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
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Nueva Tarea de Limpieza</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className={labelCls}>Área</label>
          <input name="area" type="text" className={fieldCls} placeholder="Ej. Obrador" />
          {state.errors?.area && (
            <p className="mt-1 text-xs text-rose-600">{state.errors.area[0]}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Tarea</label>
          <input name="task" type="text" className={fieldCls} placeholder="Ej. Limpieza de superficies" />
          {state.errors?.task && (
            <p className="mt-1 text-xs text-rose-600">{state.errors.task[0]}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Frecuencia</label>
          <select name="frequency" defaultValue="Diaria" className={fieldCls}>
            {FREQUENCIES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
          >
            <PlusIcon className="w-5 h-5" />
            Añadir
          </button>
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
