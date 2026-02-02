import { UpdateEmployee, DeleteEmployee, ToggleApproval } from '@/app/ui/employees/buttons';
import { prisma } from '@/lib/prisma';
import clsx from 'clsx';
import {
    BriefcaseIcon,
    IdentificationIcon,
    PhoneIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';

export default async function EmployeesList({
    query,
}: {
    query: string;
}) {
    let employees: any[] = [];

    try {
        employees = await prisma.user.findMany({
            where: {
                AND: [
                    { role: { notIn: ['USER'] } }, // Workers only
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                        ]
                    }
                ]
            },
            orderBy: { name: 'asc' },
        });
    } catch (e) {
        return <div className="p-4 text-red-500">Error cargando trabajadores.</div>;
    }

    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                    <table className="hidden min-w-full text-gray-900 md:table">
                        <thead className="rounded-lg text-left text-sm font-normal">
                            <tr>
                                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                                    Empleado
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Rol
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Estado
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Contacto
                                </th>
                                <th scope="col" className="relative py-3 pl-6 pr-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {employees.map((employee) => {
                                const initials = employee.firstName ? employee.firstName.charAt(0) : (employee.name ? employee.name.charAt(0) : 'U');
                                const role = employee.role;
                                const roleBadgeColor = role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';

                                return (
                                    <tr
                                        key={employee.id}
                                        className="w-full border-b py-3 text-sm last-of-type:border-none hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{employee.name}</p>
                                                    <p className="text-xs text-gray-500">{employee.firstName} {employee.lastName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", roleBadgeColor)}>
                                                {role === 'ADMIN' ? 'Administrador' : (role === 'CHEF' ? 'Cocinero' : 'Trabajador')}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            {employee.approved ? (
                                                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                    <CheckCircleIcon className="h-4 w-4" />
                                                    <span>Activo</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                                    <XCircleIcon className="h-4 w-4" />
                                                    <span>Inactivo</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            <div className="flex flex-col gap-1 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <EnvelopeIcon className="h-3 w-3" />
                                                    {employee.email}
                                                </div>
                                                {employee.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <PhoneIcon className="h-3 w-3" />
                                                        {employee.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                            <div className="flex justify-end gap-3">
                                                <UpdateEmployee id={employee.id} />
                                                <ToggleApproval id={employee.id} approved={employee.approved} />
                                                <DeleteEmployee id={employee.id} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
