'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteObradorSupplier } from '@/app/lib/actions/obrador-suppliers';

export default function DeleteObradorSupplier({ id }: { id: string }) {
  const deleteWithId = deleteObradorSupplier.bind(null, id);
  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="inline-flex items-center gap-1 text-rose-600 text-sm font-bold hover:underline"
      >
        <TrashIcon className="w-4 h-4" />
        Borrar
      </button>
    </form>
  );
}
