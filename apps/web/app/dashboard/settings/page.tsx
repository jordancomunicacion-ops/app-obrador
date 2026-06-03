import Link from "next/link";
import {
    BuildingStorefrontIcon,
    BuildingOffice2Icon,
    Cog6ToothIcon,
    KeyIcon,
    PlusIcon,
    ChevronRightIcon,
    UserGroupIcon,
    ScaleIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { prisma } from "@/app/lib/prisma";
import { currentBusinessId } from "@/app/lib/auth/business";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import PageHeader from "@/app/ui/primitives/page-header";
import { createLocation } from "@/app/lib/actions/locations";
import CategoryList from "@/app/ui/settings/category-list";
import PackagingList from "@/app/ui/settings/packaging-list";

export const dynamic = "force-dynamic";

/**
 * Configuración = vista principal de locales del negocio activo.
 * Cada local es una tarjeta clicable a su detalle (datos + API key + empleados).
 *
 * La integración con el CRM ya no se gestiona aquí a nivel global: vive dentro
 * de cada local en `/dashboard/settings/locations/[id]`, porque cada local
 * tiene su propia API key independiente.
 */
export default async function SettingsPage() {
    const session = await auth();
    const isOwner = isPlatformOwner(session);
    const businessId = await currentBusinessId();

    const locations = !businessId && !isOwner
        ? []
        : await prisma.location.findMany({
            where: businessId ? { businessId } : {},
            orderBy: [{ isActive: "desc" }, { name: "asc" }],
            select: {
                id: true, name: true, shortCode: true, address: true, isActive: true,
                apiKeys: { select: { id: true }, take: 1 },
                _count: { select: { members: true, employments: true } },
            },
        });

    return (
        <main className="space-y-8">
            <PageHeader icon={<Cog6ToothIcon className="w-6 h-6" />} title="Configuración" />

            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900">
                        <BuildingStorefrontIcon className="h-6 w-6 text-emerald-600" />
                        Locales del negocio
                    </h2>
                    <form action={createLocation} className="flex items-end gap-2">
                        <input
                            name="name"
                            required
                            placeholder="Nuevo local"
                            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                            <PlusIcon className="w-4 h-4 stroke-[3px]" />
                            Crear
                        </button>
                    </form>
                </div>

                {locations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
                        <BuildingStorefrontIcon className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm font-semibold text-gray-700">No hay locales</p>
                        <p className="mt-1 text-sm text-gray-500">
                            {businessId
                                ? "Crea el primer local del negocio con el formulario de arriba."
                                : "Selecciona un negocio en el selector de arriba para gestionar sus locales."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {locations.map((loc) => {
                            const empCount = loc._count.members + loc._count.employments;
                            const hasKey = loc.apiKeys.length > 0;
                            return (
                                <Link
                                    key={loc.id}
                                    href={`/dashboard/settings/locations/${loc.id}`}
                                    className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                                <BuildingStorefrontIcon className="h-6 w-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="truncate text-base font-bold text-gray-900">{loc.name}</h3>
                                                <p className="truncate text-xs text-gray-500">
                                                    {loc.shortCode ? `${loc.shortCode} · ` : ""}
                                                    {loc.address || "Sin dirección"}
                                                </p>
                                            </div>
                                        </div>
                                        {!loc.isActive && (
                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                                Inactivo
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <KeyIcon className="h-4 w-4" />
                                            <span className={hasKey ? "font-semibold text-emerald-700" : ""}>
                                                {hasKey ? "API key activa" : "Sin API key"}
                                            </span>
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <UserGroupIcon className="h-4 w-4" />
                                            {empCount} {empCount === 1 ? "empleado" : "empleados"}
                                        </span>
                                        <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-emerald-600" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            <section>
                <h2 className="mb-3 text-lg font-bold tracking-tight text-gray-900">Catálogo</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <CategoryList />
                    <PackagingList />
                </div>
            </section>

            {isOwner && (
                <section>
                    <h2 className="mb-3 text-lg font-bold tracking-tight text-gray-900">Administración de plataforma</h2>
                    <p className="mb-3 text-sm text-gray-500">
                        Solo visible para el super administrador. Da de alta los negocios (clientes)
                        de la plataforma. Los accesos de cada empleado se gestionan dentro de su
                        local (en la sección "Empleados con acceso al local").
                    </p>
                    <Link
                        href="/dashboard/settings/empresas"
                        className="inline-flex max-w-md items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                        <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
                        <div>
                            <p className="font-semibold text-slate-900">Empresas</p>
                            <p className="text-sm text-slate-500">Crear y editar los negocios cliente</p>
                        </div>
                    </Link>
                </section>
            )}

            <section>
                <h2 className="mb-3 text-lg font-bold tracking-tight text-gray-900">Otros</h2>
                <Link
                    href="/dashboard/obrador/legal"
                    className="inline-flex max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                    <ScaleIcon className="h-6 w-6 text-slate-500" />
                    <div>
                        <p className="font-semibold text-slate-900">Aviso legal</p>
                        <p className="text-sm text-slate-500">Aviso legal y sanitario de la aplicación</p>
                    </div>
                </Link>
            </section>
        </main>
    );
}
