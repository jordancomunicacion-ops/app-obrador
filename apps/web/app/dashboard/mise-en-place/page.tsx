import { Suspense } from 'react';
import { getTimbre } from '@/app/lib/actions/mise';
import MiseEnPlaceTabs from '@/app/ui/timbre/mise-en-place-tabs';

export default async function MiseEnPlacePage() {
    const timbre = await getTimbre();

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold leading-tight text-gray-900">Mise en Place Inteligente</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Gestiona tu timbre y deja que el sistema organice tus partidas optimizando el espacio y los tamaños GN.
                </p>
            </header>

            <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando...</div>}>
                <MiseEnPlaceTabs timbre={timbre} />
            </Suspense>
        </div>
    );
}
