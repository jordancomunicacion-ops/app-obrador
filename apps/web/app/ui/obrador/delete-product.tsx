'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteObradorProduct } from '@/app/lib/actions/obrador-products';

export default function DeleteObradorProduct({ id }: { id: string }) {
  const deleteWithId = deleteObradorProduct.bind(null, id);
  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="flex-1 w-full inline-flex items-center justify-center gap-1 py-2 bg-rose-50 text-rose-700 text-sm font-semibold rounded-lg hover:bg-rose-100 transition-colors"
      >
        <TrashIcon className="w-4 h-4" />
        Borrar
      </button>
    </form>
  );
}
