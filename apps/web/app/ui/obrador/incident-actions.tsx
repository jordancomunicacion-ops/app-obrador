'use client';

import { CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { closeIncident, deleteIncident } from '@/app/lib/actions/obrador-compliance';

export function CloseIncident({ id }: { id: string }) {
  const closeWithId = closeIncident.bind(null, id);
  return (
    <form action={closeWithId}>
      <button
        type="submit"
        className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold hover:underline"
        title="Cerrar incidencia"
      >
        <CheckCircleIcon className="w-4 h-4" />
        Cerrar
      </button>
    </form>
  );
}

export function DeleteIncident({ id }: { id: string }) {
  const deleteWithId = deleteIncident.bind(null, id);
  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="text-slate-400 hover:text-rose-600 transition-colors"
        title="Borrar incidencia"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </form>
  );
}
