import DashboardAlerts from '@/app/ui/dashboard/alerts';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import Link from 'next/link';
import { CalendarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

import { locationScope } from '@/lib/auth/scope';

export default async function Page() {
    const scope = await locationScope();
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const sevenDaysLater = endOfDay(addDays(today, 7));

    // Fetch Upcomming Events Count
    const upcomingEventsCount = await prisma.event.count({
        where: {
            ...scope,
            date: {
                gte: todayStart
            }
        }
    });

    // Fetch Tasks (Pending, In Progress or Issue) - Show all backlog
    const tasksTodayCount = await prisma.task.count({
        where: {
            ...scope,
            status: {
                not: 'DONE'
            }
        }
    });

    // Fetch Weekly Summary Events with Progress
    const weeklyEvents = await prisma.event.findMany({
        where: {
            ...scope,
            date: {
                gte: todayStart,
                lte: sevenDaysLater
            }
        },
        orderBy: {
            date: 'asc'
        },
        include: {
            _count: {
                select: { menuItems: true }
            }
        }
    });

    const eventsWithProgress = await Promise.all(weeklyEvents.map(async (event) => {
        const totalTasks = await prisma.task.count({ where: { ...scope, events: { some: { id: event.id } } } });
        const doneTasks = await prisma.task.count({ where: { ...scope, events: { some: { id: event.id } }, status: 'DONE' } });
        return {
            ...event,
            progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
        };
    }));

    return (
        <main>
            <h1 className="mb-4 text-xl md:text-2xl">
                Dashboard
            </h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/events" className="rounded-xl bg-gray-50 p-2 shadow-sm hover:bg-gray-100 transition-colors">
                    <div className="flex p-4">
                        <CalendarIcon className="h-5 w-5 text-gray-700" />
                        <h3 className="ml-2 text-sm font-medium">Próximos Eventos</h3>
                    </div>
                    <p className="truncate rounded-xl bg-white px-4 py-8 text-center text-2xl font-bold">
                        {upcomingEventsCount}
                    </p>
                </Link>
                <Link href="/dashboard/tasks" className="rounded-xl bg-gray-50 p-2 shadow-sm hover:bg-gray-100 transition-colors">
                    <div className="flex p-4">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-gray-700" />
                        <h3 className="ml-2 text-sm font-medium">Tareas Pendientes</h3>
                    </div>
                    <p className="truncate rounded-xl bg-white px-4 py-8 text-center text-2xl font-bold">
                        {tasksTodayCount}
                    </p>
                </Link>
                <DashboardAlerts />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
                <div className="w-full md:col-span-4 lg:col-span-8">
                    <h2 className="mb-4 text-xl md:text-2xl">Resumen de la Semana</h2>
                    <div className="rounded-xl bg-gray-50 p-4">
                        {eventsWithProgress.length > 0 ? (
                            <div className="mt-8 flow-root">
                                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                        <table className="min-w-full divide-y divide-gray-300">
                                            <thead>
                                                <tr>
                                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                                        Evento
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Fecha
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Progreso
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Pax
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Platos
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Estado
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {eventsWithProgress.map((event) => (
                                                    <tr key={event.id}>
                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 hover:text-blue-600">
                                                            <Link href={`/dashboard/events/${event.id}`}>
                                                                {event.name}
                                                            </Link>
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {format(new Date(event.date), 'dd/MM/yyyy')}
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-24 rounded-full bg-gray-200 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-blue-600 transition-all duration-500"
                                                                        style={{ width: `${event.progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium">{event.progress}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {event.pax}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                            {event._count.menuItems}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${event.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {event.status === 'CONFIRMED' ? 'Confirmado' : event.status === 'DRAFT' ? 'Borrador' : event.status === 'COMPLETED' ? 'Completado' : event.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-center py-8">No hay eventos programados para los próximos 7 días.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
