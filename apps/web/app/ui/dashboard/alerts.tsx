import { prisma } from '@/app/lib/prisma';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function DashboardAlerts() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Fetch transformations older than 6 months
    const staleTransformations = await prisma.transformation.findMany({
        where: {
            createdAt: {
                lt: sixMonthsAgo
            }
        },
        include: {
            sourceProduct: true
        },
        orderBy: {
            createdAt: 'asc'
        },
        take: 5 // Limit to 5 for the dashboard widget
    });

    if (staleTransformations.length === 0) {
        return (
            <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
                <div className="flex p-4">
                    <h3 className="ml-2 text-sm font-medium">Avisos y Alertas</h3>
                </div>
                <p className="truncate rounded-xl bg-white px-4 py-8 text-center text-2xl">
                    0
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
            <div className="flex p-4">
                <h3 className="ml-2 text-sm font-medium">Avisos y Alertas</h3>
            </div>
            <div className="rounded-xl bg-white px-4 py-2 text-sm space-y-2">
                {staleTransformations.map((trans) => (
                    <div key={trans.id} className="flex justify-between items-center border-b last:border-0 py-2">
                        <div className="flex flex-col truncate">
                            <span className="font-semibold truncate" title={trans.name}>{trans.name}</span>
                            <span className="text-xs text-gray-500">{trans.createdAt.toLocaleDateString()}</span>
                        </div>
                        <Link
                            href={`/dashboard/products/${trans.sourceProductId}`}
                            className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded hover:bg-blue-100 ml-2"
                        >
                            Ver
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
