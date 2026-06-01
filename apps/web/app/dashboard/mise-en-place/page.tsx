import { Suspense } from 'react';
import { getTimbre } from '@/app/lib/actions/mise';
import MiseEnPlaceTabs from '@/app/ui/timbre/mise-en-place-tabs';
import PageHeader from '@/app/ui/primitives/page-header';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default async function MiseEnPlacePage() {
    const timbre = await getTimbre();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader
                icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
                title="Mise en place inteligente"
                description="Gestiona tu timbre y deja que el sistema organice tus partidas optimizando espacio y tamaños GN."
            />

            <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando...</div>}>
                <MiseEnPlaceTabs timbre={timbre} />
            </Suspense>
        </div>
    );
}
