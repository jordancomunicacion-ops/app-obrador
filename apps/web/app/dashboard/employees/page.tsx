import { prisma } from '@/app/lib/prisma';
import { CreateEmployee } from '@/app/ui/employees/buttons';
import { Suspense } from 'react';
import Search from '@/app/ui/search';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { auth } from '@/auth';
import EmployeesList from '@/app/ui/employees/list';
import ImportContabilidadButton from '@/app/ui/employees/import-contabilidad-button';

/**
 * Gestión de Usuarios (= equipo del negocio activo).
 *
 * Tras la migración al modelo CRM (Business + BusinessAccess), esta página
 * lista ÚNICAMENTE el equipo (empleados) del usuario actual. El alta de
 * clientes/negocios y la concesión de accesos ahora viven en
 * `/dashboard/settings/empresas` y `/dashboard/settings/accesos`.
 */
export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{ query?: string; page?: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id;

    const params = await searchParams;
    const query = params?.query || '';

    let teamCount = 0;
    try {
        if (userId) {
            teamCount = await prisma.user.count({ where: { adminId: userId } });
        }
    } catch (e) {
        console.error("Database connection failed in counts:", e);
    }

    return (
        <div className="w-full space-y-8 p-4 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                        <ShieldCheckIcon className="h-7 w-7 text-[var(--accent-soft-contrast)]" />
                        Gestión de usuarios
                    </h1>
                    <p className="mt-1 text-base text-gray-500">
                        Administra el acceso y los permisos de tu equipo. Equipo actual: {teamCount}.
                    </p>
                </div>
                <div className="flex items-start gap-3">
                    <ImportContabilidadButton />
                    <CreateEmployee />
                </div>
            </div>

            <div className="relative">
                <Search placeholder="Buscar empleado..." />
            </div>

            <Suspense key={query} fallback={<div className="flex py-20 justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>}>
                <EmployeesList query={query} />
            </Suspense>
        </div>
    );
}
