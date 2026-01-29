import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PencilIcon, CalendarIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import GenerateTasksButton from '@/app/ui/events/generate-tasks-button';

export default async function Page({ params }: { params: { id: string } }) {
    const id = params.id;
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            menuItems: {
                include: {
                    recipe: true
                }
            }
        }
    });

    if (!event) {
        notFound();
    }

    // Fetch associated tasks (we'll assume regex matching for now as per action logic, 
    // or we can update the action to link them if we added a relation. 
    // For now, let's just query tasks that might belong to this event.
    // Actually, in the action I didn't link them via ID, just Description.
    // Let's rely on description for now: "Generado desde Evento: ${event.name}"
    // A better way is to add eventId to Task schema, but let's stick to the plan of "Production Section".

    const tasks = await prisma.task.findMany({
        where: {
            description: {
                contains: `Generado desde Evento: ${event.name}`
            }
        }
    });

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">{event.name}</h1>
                <div className="flex gap-2">
                    <Link
                        href={`/dashboard/events/${id}/edit`}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                        <PencilIcon className="w-5" />
                        Editar Evento
                    </Link>
                </div>
            </div>

            {/* Event Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Fecha</p>
                        <p className="font-semibold">{format(event.date, 'dd MMMM yyyy', { locale: es })}</p>
                    </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                        <UserGroupIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Pax (Comensales)</p>
                        <p className="font-semibold">{event.pax}</p>
                    </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Margen Seguridad</p>
                        <p className="font-semibold">{(event.safetyMargin - 1) * 100}% (x{event.safetyMargin})</p>
                    </div>
                </div>
            </div>

            {/* Menu & Production */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Menu Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold">Menú Confirmado</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {event.menuItems.map((item) => {
                            const targetQty = item.servingsOverride || event.pax;
                            return (
                                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.recipe.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Receta base: {item.recipe.yieldQuantity} {item.recipe.yieldUnit || 'UD'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-blue-600">{targetQty} pax</p>
                                        {item.servingsOverride && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                                Personalizado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {event.menuItems.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No hay platos asignados. Edita el evento para añadir recetas.
                            </div>
                        )}
                    </div>
                </div>

                {/* Production Tasks Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Tareas de Producción</h2>
                        <GenerateTasksButton eventId={id} disabled={event.menuItems.length === 0} />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-1">
                                        <Link href={`/dashboard/tasks/${task.id}/edit`} className="font-medium text-blue-600 hover:underline">
                                            {task.title}
                                        </Link>
                                        <span className={`px-2 py-1 text-xs rounded-full ${task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Objetivo: <span className="font-semibold">{task.targetQuantity}</span>
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No se han generado tareas de producción todavía.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
