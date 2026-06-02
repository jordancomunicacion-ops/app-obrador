import Link from 'next/link';
import { ScaleIcon, BuildingStorefrontIcon, KeyIcon } from '@heroicons/react/24/outline';
import CategoryList from '@/app/ui/settings/category-list';
import PackagingList from '@/app/ui/settings/packaging-list';
import PageHeader from '@/app/ui/primitives/page-header';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Page() {
    return (
        <main>
            <PageHeader icon={<Cog6ToothIcon className="w-6 h-6" />} title="Configuración" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <CategoryList />
                </div>
                <div>
                    <PackagingList />
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/dashboard/settings/locations"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                    <BuildingStorefrontIcon className="h-6 w-6 text-slate-500" />
                    <div>
                        <p className="font-semibold text-slate-900">Locales</p>
                        <p className="text-sm text-slate-500">Establecimientos y datos del establecimiento</p>
                    </div>
                </Link>
                <Link
                    href="/dashboard/obrador/legal"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                    <ScaleIcon className="h-6 w-6 text-slate-500" />
                    <div>
                        <p className="font-semibold text-slate-900">Aviso legal</p>
                        <p className="text-sm text-slate-500">Aviso legal y sanitario de la aplicación</p>
                    </div>
                </Link>
                <Link
                    href="/dashboard/settings/integration"
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                    <KeyIcon className="h-6 w-6 text-slate-500" />
                    <div>
                        <p className="font-semibold text-slate-900">Integración CRM</p>
                        <p className="text-sm text-slate-500">Genera la API key para conectar esta cuenta al CRM</p>
                    </div>
                </Link>
            </div>
        </main>
    );
}
