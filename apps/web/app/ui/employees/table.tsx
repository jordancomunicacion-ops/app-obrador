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
    CalendarDaysIcon
} from '@heroicons/react/24/outline';

import { auth } from '@/auth';
import { isPlatformOwner } from '@/lib/auth/platform';

export default async function EmployeesTable({
    query,
    currentPage,
    tab = 'team',
}: {
    query: string;
    currentPage: number;
    tab?: string;
}) {
    const session = await auth();
    const isMasterAdmin = isPlatformOwner(session);
    const userId = session?.user?.id;

    let whereClause: any = {};

    if (tab === 'requests') {
        // Clients / Tenants: All Admins except myself
        whereClause = {
            role: 'ADMIN',
            // adminId: null, // Removed constraint: Show ALL Admins (created by me or independent)
        };

        // Safety check: Exclude current user
        if (userId) {
            whereClause.id = { not: userId };
        }
    } else {
        // Fallback or explicit team view if used here (though List handles team usually)
        // If we reuse this table for team:
        // whereClause = { NOT: { role: 'ADMIN' } }; // Old logic
        // But better to leave empty or handled by properties if reused.
        // Given existing code context, let's keep it safe.
        // Actually, if tab != requests, we shouldn't really be here via main page logic, but let's default to USERs to be safe.
        whereClause = { role: 'USER' };
    }

    let employees: any[] = [];
    let dbError = false;

    try {
        employees = await prisma.user.findMany({
            where: {
                AND: [
                    whereClause,
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                        ]
                    }
                ]
            },
            orderBy: { createdAt: 'desc' }, // Newest first for requests
        });
    } catch (e) {
        console.error("Database connection failed in table:", e);
        dbError = true;
    }

    if (dbError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-[2.5rem] border border-red-100 text-center px-4">
                <XCircleIcon className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-800">Error de conexión</h3>
                <p className="text-red-600 max-w-md mt-2">
                    No se ha podido conectar con la base de datos (localhost:5432).
                    Asegúrate de que Docker o Postgres estén activos para ver los datos reales.
                </p>
                <p className="text-red-500 text-sm mt-4 italic font-medium">
                    (Aun así, deberías poder ver mis cambios en el título y colores de la página)
                </p>
            </div>
        );
    }

    const isRequests = tab === 'requests';
    const themeColor = isRequests ? 'orange' : 'blue';

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {employees.map((employee: any) => {
                const role = employee.role || 'TRABAJADOR';

                // Role-based coloring (Matching App Ganadera style)
                const avatarColor = isRequests ? 'bg-orange-600 shadow-orange-100' :
                    (role === 'ADMIN' ? 'bg-purple-600 shadow-purple-100' :
                        (role === 'CHEF' ? 'bg-blue-600 shadow-blue-100' : 'bg-blue-500 shadow-blue-100'));

                const badgeStyles = isRequests
                    ? "bg-orange-50 text-orange-700 ring-orange-100"
                    : (role === 'ADMIN' ? "bg-purple-50 text-purple-700 ring-purple-100" :
                        (role === 'CHEF' ? "bg-blue-50 text-blue-700 ring-blue-100" : "bg-sky-50 text-sky-700 ring-sky-100"));

                const birthDate = employee.dob ? new Date(employee.dob) : null;
                const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : null;

                const initials = employee.firstName ? employee.firstName.charAt(0) : (employee.name ? employee.name.charAt(0) : 'U');
                const fullName = employee.firstName ? `${employee.firstName} ${employee.lastName || ''}` : (employee.name || 'Usuario');

                return (
                    <div
                        key={employee.id}
                        className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="p-6">
                            {/* Card Header: Avatar + Role Badge */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white shadow-sm",
                                        avatarColor
                                    )}>
                                        {initials}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 leading-tight">
                                            {fullName}
                                        </h3>
                                        <p className="text-xs text-gray-500">@{employee.name || 'usuario'}</p>
                                    </div>
                                </div>
                                <span className={clsx(
                                    "rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider ring-1",
                                    badgeStyles
                                )}>
                                    {isRequests ? 'CLIENTE' : (role === 'ADMIN' ? 'ADMINISTRADOR' : role === 'CHEF' ? 'COCINERO' : 'TRABAJADOR')}
                                </span>
                            </div>

                            {/* Status Section */}
                            <div className="mt-6 flex items-center gap-2 px-1">
                                {employee.approved ? (
                                    <div className={clsx(
                                        "flex items-center gap-2 text-[14px] font-bold",
                                        "text-blue-600"
                                    )}>
                                        <CheckCircleIcon className="h-5 w-5 stroke-[2.5px]" />
                                        <span>Autorizado</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[14px] font-bold text-red-500">
                                        <XCircleIcon className="h-5 w-5 stroke-[2.5px]" />
                                        <span>Acceso denegado</span>
                                    </div>
                                )}
                            </div>

                            {/* Details Section */}
                            <div className="mt-8 space-y-4 px-1">
                                <div className="flex items-center gap-3 text-[15px] font-medium text-gray-500">
                                    <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                                    <span>{employee.jobTitle || (isRequests ? 'Sin puesto definido' : 'Sin puesto asignado')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[15px] font-medium text-gray-500">
                                    <IdentificationIcon className="h-5 w-5 text-gray-400" />
                                    <span>{employee.dni || 'Sin DNI'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[15px] font-medium text-gray-500">
                                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                                    <span>{employee.phone || 'Sin Teléfono'}</span>
                                </div>
                                {birthDate && (
                                    <div className="flex items-center gap-3 text-[15px] font-medium text-gray-500">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                        <span>{birthDate.toLocaleDateString()} {age !== null && `(${age} años)`}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-[15px] font-medium text-gray-500">
                                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                                    <span>Alta: {new Date(employee.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions Section - Fixed layout with 3 actions */}
                        <div className="mt-auto flex items-center justify-between border-t border-gray-50 bg-gray-50/30 px-6 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <UpdateEmployee id={employee.id} theme={themeColor as any} />
                            <DeleteEmployee id={employee.id} />
                            <ToggleApproval id={employee.id} approved={employee.approved} theme={themeColor as any} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
