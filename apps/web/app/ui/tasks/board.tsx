import { TaskStatusButton, AssignTaskButton } from '@/app/ui/tasks/buttons';
import TimeInfo from './time-info';
import { prisma } from '@/app/lib/prisma';
import { currentOrgId } from '@/auth';
import clsx from 'clsx';
import { User, Recipe } from '@prisma/client';
import { locationScope } from '@/app/lib/auth/scope';
import { startOfDayUTC } from '@/app/lib/recurrence';

type TaskWithRelations = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    assignedTo: User | null;
    recipe: Recipe | null;
    plannedStart: Date | null;
    plannedEnd: Date | null;
};

export default async function TaskBoard({ range = 'today' }: { range?: string }) {
    // Filtro temporal: por defecto "hoy" (incluye tareas sin hora planificada, que
    // siguen activas). Evita que el tablero se sature con las tareas recurrentes
    // de días pasados. "all" muestra todo.
    let dateWhere: Record<string, unknown> = {};
    if (range !== 'all') {
        const start = startOfDayUTC();
        const end = startOfDayUTC();
        end.setUTCDate(end.getUTCDate() + (range === 'week' ? 6 : 0));
        end.setUTCHours(23, 59, 59, 999);
        dateWhere = {
            OR: [{ plannedStart: { gte: start, lte: end } }, { plannedStart: null }],
        };
    }

    const tasks = await prisma.task.findMany({
        where: { ...(await locationScope()), ...dateWhere },
        include: {
            assignedTo: true,
            recipe: true
        },
        orderBy: { plannedStart: 'asc' },
    });

    // Orden por hora programada: primero lo que toca antes. Las tareas sin hora
    // programada van al final (desempate por fecha de creación, más reciente primero).
    const ordered = [...tasks].sort((a, b) => {
        const at = a.plannedStart ? a.plannedStart.getTime() : Infinity;
        const bt = b.plannedStart ? b.plannedStart.getTime() : Infinity;
        return at - bt || b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Asignables: gente del negocio activo (no todos los usuarios de la BD).
    const orgId = await currentOrgId();
    const users = await prisma.user.findMany({
        where: orgId
            ? {
                OR: [
                    { id: orgId },
                    { employments: { some: { isActive: true, empresa: { businessId: orgId } } } },
                ],
            }
            : {},
        orderBy: { name: 'asc' }
    });

    const columns = [
        { id: 'PENDING', title: 'Pendiente', color: 'bg-gray-50 border-gray-200' },
        { id: 'IN_PROGRESS', title: 'En Curso', color: 'bg-blue-50 border-blue-200' },
        { id: 'DONE', title: 'Completado', color: 'bg-green-50 border-green-200' },
        { id: 'ISSUE', title: 'Incidencia', color: 'bg-red-50 border-red-200' },
    ];

    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto min-w-[800px] pb-4 h-[calc(100vh-200px)]">
            {columns.map(col => (
                <div key={col.id} className={`rounded-lg border p-4 ${col.color} flex flex-col h-full max-h-full`}>
                    <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                        {col.title}
                        <span className="bg-white px-2 py-0.5 rounded text-sm text-gray-500 border">
                            {ordered.filter(t => t.status === col.id).length}
                        </span>
                    </h3>
                    <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                        {ordered.filter(t => t.status === col.id).map(task => (
                            <div key={task.id} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}

                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                    {task.assignedTo && (
                                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                            {task.assignedTo.name}
                                        </span>
                                    )}
                                    {task.recipe && (
                                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                                            🍳 {task.recipe.name}
                                        </span>
                                    )}
                                    {task.recipe?.category === 'ELABORACION_FINAL' && (
                                        <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                            Final
                                        </span>
                                    )}
                                    {task.recipe?.category === 'ELABORACION_INTERMEDIA' && (
                                        <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">
                                            Intermedia
                                        </span>
                                    )}
                                </div>

                                <TimeInfo
                                    plannedStart={task.plannedStart}
                                    plannedEnd={task.plannedEnd}
                                    realStart={task.realStart}
                                    realEnd={task.realEnd}
                                    status={task.status}
                                    category={task.recipe?.category}
                                />

                                <div className="mt-3 flex justify-end gap-1 pt-2 border-t border-gray-50">
                                    {/* Status Transitions */}
                                    {task.status === 'PENDING' && (
                                        <>
                                            <AssignTaskButton id={task.id} users={users} taskTitle={task.title} />
                                            <TaskStatusButton
                                                id={task.id}
                                                status="IN_PROGRESS"
                                                currentStatus={task.status}
                                                users={users}
                                                taskTitle={task.title}
                                                isAssigned={!!task.assignedTo}
                                            />
                                        </>
                                    )}
                                    {task.status === 'IN_PROGRESS' && <TaskStatusButton id={task.id} status="DONE" currentStatus={task.status} />}
                                    {task.status === 'IN_PROGRESS' && <TaskStatusButton id={task.id} status="ISSUE" currentStatus={task.status} />}
                                    {task.status === 'ISSUE' && (
                                        <>
                                            <AssignTaskButton id={task.id} users={users} taskTitle={task.title} />
                                            <TaskStatusButton id={task.id} status="PENDING" currentStatus={task.status} />
                                            <TaskStatusButton id={task.id} status="DONE" currentStatus={task.status} />
                                        </>
                                    )}
                                    {/* Anyone can move back to pending if needed or other transitions */}
                                </div>
                            </div>
                        ))}
                        {ordered.filter(t => t.status === col.id).length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm italic">
                                Sin tareas
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
