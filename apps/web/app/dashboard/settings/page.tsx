import Link from "next/link";
import {
    BuildingOffice2Icon,
    Cog6ToothIcon,
    ScaleIcon,
} from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import PageHeader from "@/app/ui/primitives/page-header";
import CategoryList from "@/app/ui/settings/category-list";
import PackagingList from "@/app/ui/settings/packaging-list";

export const dynamic = "force-dynamic";

/**
 * Configuración = ajustes transversales del negocio: catálogo (categorías de
 * producto, categorías de receta, envases), administración de plataforma y otros.
 *
 * Los locales se gestionan en su propia sección ("Locales"); cada local agrupa
 * sus empleados, proveedores, clientes/PdV y documentación.
 */
export default async function SettingsPage() {
    const session = await auth();
    const isOwner = isPlatformOwner(session);

    return (
        <main className="space-y-8">
            <PageHeader icon={<Cog6ToothIcon className="w-6 h-6" />} title="Configuración" />

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
