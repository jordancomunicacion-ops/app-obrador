'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteObradorDocument } from '@/app/lib/actions/obrador-documents';

export default function DeleteObradorDocument({ id }: { id: string }) {
  const deleteWithId = deleteObradorDocument.bind(null, id);
  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
        title="Borrar documento"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </form>
  );
}
