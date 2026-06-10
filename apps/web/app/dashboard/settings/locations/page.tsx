import {
    BuildingStorefrontIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { prisma } from "@/app/lib/prisma";
import { currentBusinessId } from "@/app/lib/auth/business";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import PageHeader from "@/app/ui/primitives/page-header";
import { createLocation } from "@/app/lib/actions/locations";
import LocationEnterCard from "@/app/ui/locations/location-enter-card";

export const dynamic = "force-dynamic";

/**
 * Locales = lista de todos los locales del negocio activo. Cada tarjeta entra al
 * detalle del local (datos, API key, empleados) y, dentro, a sus secciones por
 * local: proveedores, clientes/PdV y documentación. Al entrar, el local pasa a
 * ser el activo para que esas secciones filtren por él.
 */
export default async function LocationsListPage() {
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
            <PageHeader icon={<BuildingStorefrontIcon className="w-6 h-6" />} title="Locales" />

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
                        {locations.map((loc) => (
                            <LocationEnterCard
                                key={loc.id}
                                id={loc.id}
                                name={loc.name}
                                shortCode={loc.shortCode}
                                address={loc.address}
                                isActive={loc.isActive}
                                hasKey={loc.apiKeys.length > 0}
                                empCount={loc._count.members + loc._count.employments}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
