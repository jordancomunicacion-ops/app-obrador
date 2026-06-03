import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeftIcon,
    BuildingStorefrontIcon,
    KeyIcon,
    UserGroupIcon,
    Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { prisma } from "@/app/lib/prisma";
import { currentBusinessId } from "@/app/lib/auth/business";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import LocationEditForm from "@/app/ui/locations/location-edit-form";
import LocationApiKey from "@/app/ui/locations/location-api-key";
import LocationEmployees from "@/app/ui/locations/location-employees";

export const dynamic = "force-dynamic";

/**
 * Detalle de un local con todas sus secciones:
 *  - Datos básicos (editar)
 *  - API key del CRM (generar/rotar/revocar)
 *  - Empleados asignados al local
 *
 * Reemplaza el antiguo flujo donde la API key se generaba a nivel de cuenta.
 * Ahora cada local tiene su propia clave para acotar la sincronización.
 */
export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const isOwner = isPlatformOwner(session);
    const activeBusinessId = await currentBusinessId();

    const location = await prisma.location.findUnique({
        where: { id },
        include: {
            apiKeys: { orderBy: { createdAt: "desc" }, take: 1 },
            members: {
                where: { approved: true },
                orderBy: [{ lastName: "asc" }, { name: "asc" }],
                select: {
                    id: true, name: true, firstName: true, lastName: true,
                    email: true, dni: true, phone: true, jobTitle: true, role: true,
                },
            },
            employments: {
                where: { isActive: true, assignedLocations: { some: { id } } },
                select: {
                    user: {
                        select: {
                            id: true, name: true, firstName: true, lastName: true,
                            email: true, dni: true, phone: true, jobTitle: true, role: true,
                        },
                    },
                },
            },
        },
    });
    if (!location) notFound();

    // Guard: el local debe pertenecer al business activo (salvo super admin).
    if (!isOwner && location.businessId !== activeBusinessId) notFound();

    // Empleados visibles: por pertenencia directa + por contrato con este local asignado.
    const employeesMap = new Map<string, (typeof location.members)[number]>();
    for (const m of location.members) employeesMap.set(m.id, m);
    for (const e of location.employments) employeesMap.set(e.user.id, e.user);
    const employees = Array.from(employeesMap.values());

    const apiKey = location.apiKeys[0] ?? null;

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Configuración
                </Link>
                <h1 className="mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900">
                    <BuildingStorefrontIcon className="h-7 w-7 text-emerald-600" />
                    {location.name}
                </h1>
                {location.shortCode && (
                    <p className="mt-1 text-sm text-gray-500">{location.shortCode}</p>
                )}
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                    <Cog6ToothIcon className="h-5 w-5 text-slate-500" />
                    Datos del local
                </h2>
                <LocationEditForm location={location} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                    <KeyIcon className="h-5 w-5 text-slate-500" />
                    API key del CRM
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                    Clave única de este local para conectar con el CRM. Pega esta clave en
                    Conexiones → Cocina del CRM; sincronizará solo los empleados y tareas de
                    este local. Rotarla invalida la anterior al instante.
                </p>
                <LocationApiKey
                    locationId={location.id}
                    initialKey={apiKey?.key ?? null}
                    initialCreatedAt={apiKey?.createdAt.toISOString() ?? null}
                />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                    <UserGroupIcon className="h-5 w-5 text-slate-500" />
                    Empleados con acceso al local ({employees.length})
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                    Personas cuyo contrato les asigna este local o que tienen pertenencia
                    directa al mismo. Para añadir o quitar empleados, gestiona sus contratos
                    en Gestión de Usuarios.
                </p>
                <LocationEmployees employees={employees} />
            </section>
        </div>
    );
}
