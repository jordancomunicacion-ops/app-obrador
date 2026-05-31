'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteObradorIntake } from '@/app/lib/actions/obrador-intake';

export default function DeleteObradorIntake({ id }: { id: string }) {
  const deleteWithId = deleteObradorIntake.bind(null, id);
  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="text-slate-400 hover:text-rose-600 transition-colors"
        title="Borrar entrada"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </form>
  );
}
