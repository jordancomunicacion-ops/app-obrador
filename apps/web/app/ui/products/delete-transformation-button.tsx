'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteTransformation } from '@/app/lib/actions/transformations';

export function DeleteTransformationButton({ transformationId, productId }: { transformationId: string; productId: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm('¿Estás seguro de que quieres eliminar esta transformación?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteTransformation(transformationId);
            router.refresh();
        } catch (error) {
            alert('Error al eliminar la transformación');
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 disabled:opacity-50"
            title="Eliminar"
        >
            <TrashIcon className="w-5 h-5" />
        </button>
    );
}
