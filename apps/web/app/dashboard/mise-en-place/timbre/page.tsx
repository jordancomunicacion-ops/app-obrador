import { ensureDefaultTimbre, getRecommendationsForTimbre } from '@/app/lib/actions/timbre';
import CreatePartitionForm from '@/app/ui/timbre/create-partition-form';
import { RecommendationDisplay } from '@/app/ui/timbre/recommendation-display';
import { deletePartition } from '@/app/lib/actions/timbre';
import { TrashIcon } from '@heroicons/react/24/outline';

// Server Action wrapper for delete button (since it needs client component or form action)
// We'll just define a small form here for simplicity or use a client component.
// For speed, I'll allow the list to be rendered here and maybe add a delete button inside RecommendationDisplay?
// Or just a separate list. Let's make a separate list view of inputs + recommendations.

export default async function Page() {
    const timbre = await ensureDefaultTimbre();
    const recommendations = await getRecommendationsForTimbre();

    // Group recommendations by ID for easy access if needed, or just iterate

    return (
        <div className="w-full p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Mise en Place Inteligente: Timbre</h1>
                <p className="mt-2 text-gray-600">
                    Define tus partidas y el sistema recomendará la organización óptima de tu Timbre ({timbre.name}).
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Input / Configuration */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold">1. Añadir Partida</h2>
                        <CreatePartitionForm timbreId={timbre.id} />
                    </div>

                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold">Configuración de Baldas</h2>
                        <div className="space-y-4">
                            {timbre.shelves.map((shelf: any) => (
                                <div key={shelf.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <span className="font-medium text-gray-700">Balda #{shelf.position}</span>
                                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-sm text-gray-600">
                                        ↕ {shelf.height}mm
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-gray-500">
                            * Las alturas se configuran en el panel de administrador.
                        </p>
                    </div>
                </div>

                {/* Right Column: Recommendations */}
                <div className="lg:col-span-2">
                    <h2 className="mb-4 text-lg font-semibold">2. Recomendaciones de Organización</h2>
                    <RecommendationDisplay recommendations={recommendations} />

                    {/* List of current partitions for management (Delete) */}
                    <div className="mt-8">
                        <h3 className="mb-4 text-md font-medium text-gray-700">Gestión de Partidas Activas</h3>
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                            <ul className="divide-y divide-gray-200">
                                {recommendations.map((rec) => (
                                    <li key={rec.partition.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gray-900">{rec.partition.name}</p>
                                            <p className="text-sm text-gray-500 capitalize">{rec.partition.type}</p>
                                        </div>
                                        <form action={async () => {
                                            'use server';
                                            await deletePartition(rec.partition.id);
                                        }}>
                                            <button type="submit" className="text-red-400 hover:text-red-600">
                                                <TrashIcon className="h-5 w-5" />
                                                <span className="sr-only">Eliminar</span>
                                            </button>
                                        </form>
                                    </li>
                                ))}
                                {recommendations.length === 0 && (
                                    <li className="p-4 text-center text-gray-500 text-sm">No hay partidas registradas.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
