'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteProduct } from '@/app/lib/actions/products';

export function DeleteProduct({ id }: { id: string }) {
    const deleteProductWithId = deleteProduct.bind(null, id);

    const handleAction = async (formData: FormData) => {
        if (window.confirm('¿Estás seguro de que quieres borrar este producto? Se borrarán también todos sus variantes y tests de rendimiento.')) {
            await deleteProductWithId();
        }
    };

    return (
        <form action={handleAction}>
            <button className="rounded-md border p-2 hover:bg-gray-100 text-red-600">
                <span className="sr-only">Borrar</span>
                <TrashIcon className="w-5" />
            </button>
        </form>
    );
}
