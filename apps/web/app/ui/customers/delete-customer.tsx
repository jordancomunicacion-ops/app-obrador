'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteCustomer } from '@/app/lib/actions/customers';

export default function DeleteCustomer({ id }: { id: string }) {
  const deleteWithId = deleteCustomer.bind(null, id);
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
