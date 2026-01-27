import DashboardAlerts from '@/app/ui/dashboard/alerts';

export default async function Page() {
    // Dashboard Main Page
    return (
        <main>
            <h1 className="mb-4 text-xl md:text-2xl">
                Dashboard
            </h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Cards will go here */}
                <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
                    <div className="flex p-4">
                        <h3 className="ml-2 text-sm font-medium">Próximos Eventos</h3>
                    </div>
                    <p className="truncate rounded-xl bg-white px-4 py-8 text-center text-2xl">
                        0
                    </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
                    <div className="flex p-4">
                        <h3 className="ml-2 text-sm font-medium">Tareas Hoy</h3>
                    </div>
                    <p className="truncate rounded-xl bg-white px-4 py-8 text-center text-2xl">
                        0
                    </p>
                </div>
                <DashboardAlerts />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
                {/* Recent Events or Gantt Chart placeholder */}
                <div className="w-full md:col-span-4">
                    <h2 className="mb-4 text-xl md:text-2xl">Resumen Semanal</h2>
                    <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-gray-500">No hay datos recientes.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
