import { prisma } from '@/lib/prisma';
import EmployeesTable from '@/app/ui/employees/table';
import { CreateEmployee } from '@/app/ui/employees/buttons';
import { Suspense } from 'react';
import Search from '@/app/ui/search';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import clsx from 'clsx';
import { auth } from '@/auth';
import EmployeesList from '@/app/ui/employees/list';

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
        tab?: string;
    }>;
}) {
    const session = await auth();
    const userEmail = session?.user?.email;
    const isMasterAdmin = userEmail?.toLowerCase() === 'gerencia@sotodelprior.com';
    const userId = session?.user?.id;

    const params = await searchParams;
    const query = params?.query || '';
    const currentPage = Number(params?.page) || 1;
    const tab = params?.tab || 'team';

    let teamCount = 0;
    let requestsCount = 0;
    let pendingCount = 0;

    try {
        if (userId) {
            // Team: My workers (Users where I am the admin).
            // Exclude self to match the list view.
            teamCount = await prisma.user.count({
                where: {
                    adminId: userId
                }
            });
        }

        if (isMasterAdmin) {
            // Requests: New Tenants (ADMIN role, no adminId, approved=false)
            requestsCount = await prisma.user.count({
                where: {
                    role: 'ADMIN',
                    adminId: null,
                    // email: { not: 'gerencia@sotodelprior.com' } 
                }
            });
            pendingCount = await prisma.user.count({
                where: {
                    role: 'ADMIN',
                    adminId: null,
                    approved: false
                }
            });
        }
    } catch (e) {
        console.error("Database connection failed in counts:", e);
    }

    return (
        <div className="w-full space-y-8 p-4 md:p-8">
            {/* Header Section */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                        <ShieldCheckIcon className="h-9 w-9 text-blue-600" />
                        Gestión de Usuarios
                    </h1>
                    <p className="mt-1 text-base text-gray-500">
                        Administra el acceso y los permisos de su equipo{isMasterAdmin ? ' y clientes' : ''}.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-end">
                    {/* Real Tab Switcher */}
                    <div className="flex rounded-xl bg-gray-100/80 p-1 ring-1 ring-gray-200">
                        <Link
                            href="?tab=team"
                            className={clsx(
                                "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
                                tab === 'team'
                                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                                    : "text-gray-500 hover:text-gray-700"
                                , "whitespace-nowrap"
                            )}
                        >
                            Equipo ({teamCount})
                        </Link>
                        {isMasterAdmin && (
                            <Link
                                href="?tab=requests"
                                className={clsx(
                                    "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all flex items-center gap-2",
                                    tab === 'requests'
                                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                                        : "text-gray-500 hover:text-gray-700"
                                    , "whitespace-nowrap"
                                )}
                            >
                                Clientes / Solicitudes
                                {pendingCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>
                        )}
                    </div>
                    {tab === 'team' && <CreateEmployee />}
                </div>
            </div>

            {/* Search Bar Section */}
            <div className="relative">
                <Search placeholder={tab === 'team' ? "Buscar empleado..." : "Buscar cliente..."} />
            </div>

            {/* List Section */}
            <Suspense key={tab + query} fallback={<div className="flex py-20 justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>}>
                {tab === 'team' ? (
                    <EmployeesList query={query} />
                ) : (
                    <EmployeesTable query={query} currentPage={currentPage} tab={tab} />
                )}
            </Suspense>
        </div>
    );
}
