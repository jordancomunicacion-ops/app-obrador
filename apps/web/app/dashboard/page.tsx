import DashboardAlerts from '@/app/ui/dashboard/alerts';
import { prisma } from '@/app/lib/prisma';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import Link from 'next/link';
import { CalendarIcon, ClipboardDocumentListIcon, HomeIcon } from '@heroicons/react/24/outline';
import { locationScope } from '@/app/lib/auth/scope';
import PageHeader from '@/app/ui/primitives/page-header';
import Card from '@/app/ui/primitives/card';
import Badge from '@/app/ui/primitives/badge';

export default async function Page() {
    const scope = await locationScope();
    const today = new Date();
    const todayStart = startOfDay(today);
    const sevenDaysLater = endOfDay(addDays(today, 7));

    const upcomingEventsCount = await prisma.event.count({
        where: { ...scope, date: { gte: todayStart } },
    });

    const tasksTodayCount = await prisma.task.count({
        where: { ...scope, status: { not: 'DONE' } },
    });

    const weeklyEvents = await prisma.event.findMany({
        where: { ...scope, date: { gte: todayStart, lte: sevenDaysLater } },
        orderBy: { date: 'asc' },
        include: { _count: { select: { menuItems: true } } },
    });

    const eventsWithProgress = await Promise.all(
        weeklyEvents.map(async (event) => {
            const totalTasks = await prisma.task.count({
                where: { ...scope, events: { some: { id: event.id } } },
            });
            const doneTasks = await prisma.task.count({
                where: { ...scope, events: { some: { id: event.id } }, status: 'DONE' },
            });
            return {
                ...event,
                progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
            };
        }),
    );

    const statusMeta = (s: string): { label: string; tone: 'success' | 'warning' | 'neutral' } => {
        if (s === 'CONFIRMED') return { label: 'Confirmado', tone: 'success' };
        if (s === 'DRAFT') return { label: 'Borrador', tone: 'warning' };
        if (s === 'COMPLETED') return { label: 'Completado', tone: 'neutral' };
        return { label: s, tone: 'neutral' };
    };

    return (
        <main>
            <PageHeader icon={<HomeIcon className="w-6 h-6" />} title="Dashboard" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card href="/dashboard/events" className="p-5">
                    <div className="flex items-center gap-2 text-gray-500">
                        <CalendarIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Próximos eventos</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mt-3">{upcomingEventsCount}</p>
                </Card>
                <Card href="/dashboard/tasks" className="p-5">
                    <div className="flex items-center gap-2 text-gray-500">
                        <ClipboardDocumentListIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Tareas pendientes</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mt-3">{tasksTodayCount}</p>
                </Card>
                <DashboardAlerts />
            </div>

            <section className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Resumen de la semana</h2>
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
                    {eventsWithProgress.length > 0 ? (
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Evento</th>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Progreso</th>
                                    <th className="px-4 py-3">Pax</th>
                                    <th className="px-4 py-3">Platos</th>
                                    <th className="px-4 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {eventsWithProgress.map((event) => {
                                    const meta = statusMeta(event.status);
                                    return (
                                        <tr key={event.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                <Link
                                                    href={`/dashboard/events/${event.id}`}
                                                    className="hover:text-[var(--accent-soft-contrast)]"
                                                >
                                                    {event.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {format(new Date(event.date), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 rounded-full bg-gray-200 overflow-hidden">
                                                        <div
                                                            className="h-full bg-[var(--accent)] transition-all duration-500"
                                                            style={{ width: `${event.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium">{event.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{event.pax}</td>
                                            <td className="px-4 py-3 text-gray-500">{event._count.menuItems}</td>
                                            <td className="px-4 py-3">
                                                <Badge tone={meta.tone}>{meta.label}</Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500 italic text-center py-10">
                            No hay eventos programados para los próximos 7 días.
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}
