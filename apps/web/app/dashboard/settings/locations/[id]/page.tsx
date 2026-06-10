import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeftIcon,
    BuildingStorefrontIcon,
    KeyIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    TruckIcon,
    ClipboardDocumentCheckIcon,
    ChevronRightIcon,
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
 *  - API key del CRM (única para este local)
 *  - Empleados asignados al local + permisos (Employment activos)
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
            employments: {
                where: { isActive: true, assignedLocations: { some: { id } } },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    position: true,
                    department: true,
                    canViewDashboard: true,
                    canViewEvents: true,
                    canViewTasks: true,
                    canViewCommunications: true,
                    canViewCatalog: true,
                    canViewOperations: true,
                    canViewObrador: true,
                    canViewEcommerce: true,
                    canViewEmployees: true,
                    canManageDirectory: true,
                    canEditSettings: true,
                    canViewAllNotifications: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            dni: true,
                            jobTitle: true,
                            role: true,
                        },
                    },
                },
            },
        },
    });
    if (!location) notFound();
    if (!isOwner && location.businessId !== activeBusinessId) notFound();

    const apiKey = location.apiKeys[0] ?? null;

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/dashboard/settings/locations"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Locales
                </Link>
                <h1 className="mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900">
                    <BuildingStorefrontIcon className="h-7 w-7 text-emerald-600" />
                    {location.name}
                </h1>
                {location.shortCode && (
                    <p className="mt-1 text-sm text-gray-500">{location.shortCode}</p>
                )}
            </div>

            <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                    Secciones de este local
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                        { href: "/dashboard/settings/suppliers", icon: TruckIcon, title: "Proveedores", desc: "Proveedores del local" },
                        { href: "/dashboard/settings/customers", icon: UserGroupIcon, title: "Clientes y Puntos de Venta", desc: "Clientes y PdV del local" },
                        { href: "/dashboard/obrador/documents", icon: ClipboardDocumentCheckIcon, title: "Documentación", desc: "Documentación sanitaria" },
                    ].map(({ href, icon: Icon, title, desc }) => (
                        <Link
                            key={href}
                            href={href}
                            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{title}</p>
                                <p className="truncate text-xs text-slate-500">{desc}</p>
                            </div>
                            <ChevronRightIcon className="ml-auto h-4 w-4 flex-none text-gray-300 transition-colors group-hover:text-emerald-600" />
                        </Link>
                    ))}
                </div>
            </section>

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
                    Clave única de este local. Pégala en el CRM (Conexiones → Cocina); sincronizará
                    solo los empleados y tareas de este local. Rotarla invalida la anterior al
                    instante.
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
                    Empleados con acceso al local ({location.employments.length})
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                    Personas con contrato activo asignado a este local. Cada una entra a la app
                    con su email y ve las secciones marcadas. Para quitarle el acceso al local,
                    revoca aquí (el contrato sigue para histórico).
                </p>
                <LocationEmployees
                    locationId={location.id}
                    initial={location.employments}
                />
            </section>
        </div>
    );
}
