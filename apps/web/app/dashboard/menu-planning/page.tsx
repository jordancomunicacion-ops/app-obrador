import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';

import { currentOrgId } from '@/auth';

export default async function Page() {
    const orgId = await currentOrgId();
    const services = await prisma.menuService.findMany({
        where: { ownerId: orgId },
        orderBy: { startDate: 'desc' },
        include: {
            _count: { select: { items: true } }
        }
    });

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-2xl">Planificación Menú</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Link
                    href="/dashboard/menu-planning/create"
                    className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    <span className="hidden md:block">Nuevo Servicio</span>
                    <PlusIcon className="h-5 md:ml-4" />
                </Link>
            </div>

            <div className="mt-6 flow-root">
                <div className="inline-block min-w-full align-middle">
                    <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                        <div className="md:hidden">
                            {services.map((service) => (
                                <div key={service.id} className="mb-2 w-full rounded-md bg-white p-4">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <div>
                                            <div className="mb-2 flex items-center">
                                                <p>{service.name}</p>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {format(service.startDate, 'P', { locale: es })} - {format(service.endDate, 'P', { locale: es })}
                                            </p>
                                        </div>
                                        <div className={`rounded-xl px-2 py-1 text-xs font-medium ${service.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {service.status}
                                        </div>
                                    </div>
                                    <div className="flex w-full items-center justify-between pt-4">
                                        <div>
                                            <p className="text-xl font-medium">{service._count.items} platos</p>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {/* Actions */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <table className="hidden min-w-full text-gray-900 md:table">
                            <thead className="rounded-lg text-left text-sm font-normal">
                                <tr>
                                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Nombre</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Fecha</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Estado</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Platos</th>
                                    <th scope="col" className="relative py-3 pl-6 pr-3">
                                        <span className="sr-only">Editar</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {services.map((service) => (
                                    <tr key={service.id} className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                            <div className="flex items-center gap-3">
                                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                                                <p>{service.name}</p>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            {format(service.startDate, 'P', { locale: es })} - {format(service.endDate, 'P', { locale: es })}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${service.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {service.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            {service._count.items}
                                        </td>
                                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                            {/* Edit/View Link */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
