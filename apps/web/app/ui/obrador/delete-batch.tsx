'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteObradorBatch } from '@/app/lib/actions/obrador-production';

export default function DeleteObradorBatch({ id }: { id: string }) {
  const deleteWithId = deleteObradorBatch.bind(null, id);
  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
        title="Borrar lote"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </form>
  );
}
