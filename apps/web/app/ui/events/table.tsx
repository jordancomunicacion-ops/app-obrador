import { UpdateEvent, DeleteEvent, ViewShoppingList } from '@/app/ui/events/buttons';
import { prisma } from '@/lib/prisma';
import clsx from 'clsx';
import Link from 'next/link';

export default async function EventsTable({
    query,
    currentPage,
}: {
    query: string;
    currentPage: number;
}) {
    const events = await prisma.event.findMany({
        where: {
            name: { contains: query },
        },
        orderBy: { date: 'asc' },
        include: { menuItems: true },
    });

    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                    <table className="hidden min-w-full text-gray-900 md:table">
                        <thead className="rounded-lg text-left text-sm font-normal">
                            <tr>
                                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                                    Evento
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Fecha
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Pax
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Estado
                                </th>
                                <th scope="col" className="relative py-3 pl-6 pr-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {events.map((event: any) => (
                                <tr
                                    key={event.id}
                                    className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                                >
                                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                        <div className="flex items-center gap-3">
                                            <Link href={`/dashboard/events/${event.id}`} className="font-semibold hover:text-blue-600 hover:underline">
                                                {event.name}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">
                                        {new Date(event.date).toLocaleDateString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">
                                        {event.pax}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">
                                        <span
                                            className={clsx(
                                                'inline-flex items-center rounded-full px-2 py-1 text-xs',
                                                {
                                                    'bg-gray-100 text-gray-500': event.status === 'DRAFT',
                                                    'bg-green-100 text-green-700': event.status === 'CONFIRMED',
                                                    'bg-blue-100 text-blue-700': event.status === 'COMPLETED',
                                                },
                                            )}
                                        >
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                        <div className="flex justify-end gap-3">
                                            <ViewShoppingList id={event.id} />
                                            <UpdateEvent id={event.id} />
                                            <DeleteEvent id={event.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
