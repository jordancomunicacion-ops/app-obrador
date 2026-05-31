import Link from 'next/link';
import { ScaleIcon } from '@heroicons/react/24/outline';
import CategoryList from '@/app/ui/settings/category-list';
import PackagingList from '@/app/ui/settings/packaging-list';

export default function Page() {
    return (
        <main>
            <h1 className="mb-8 text-2xl font-bold">Configuración</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <CategoryList />
                </div>
                <div>
                    <PackagingList />
                </div>
            </div>

            <div className="mt-8">
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
            </div>
        </main>
    );
}
