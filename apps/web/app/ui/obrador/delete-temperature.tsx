'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteTemperatureLog } from '@/app/lib/actions/obrador-compliance';

export default function DeleteTemperature({ id }: { id: string }) {
  const deleteWithId = deleteTemperatureLog.bind(null, id);
  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="text-slate-400 hover:text-rose-600 transition-colors"
        title="Borrar registro"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </form>
  );
}
