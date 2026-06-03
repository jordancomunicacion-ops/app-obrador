import { redirect } from "next/navigation";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import { prisma } from "@/app/lib/prisma";
import AccessControl from "@/app/ui/businesses/access-control";

export const dynamic = "force-dynamic";

export default async function AccesosPage({
    searchParams,
}: {
    searchParams: Promise<{ empresa?: string }>;
}) {
    const session = await auth();
    if (!isPlatformOwner(session)) {
        redirect("/dashboard");
    }

    const { empresa } = await searchParams;

    const businesses = await prisma.business.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true },
    });

    const selectedBusinessId = empresa ?? businesses[0]?.id ?? null;
    const accesses = selectedBusinessId
        ? await prisma.businessAccess.findMany({
              where: { businessId: selectedBusinessId },
              orderBy: { createdAt: "asc" },
          })
        : [];

    return (
        <div className="w-full space-y-8 p-4 md:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900">
                    <ShieldCheckIcon className="h-7 w-7 text-indigo-600" />
                    Accesos
                </h1>
                <p className="text-base text-gray-500">
                    Quién entra a cada empresa y con qué permisos. Los cambios se aplican al instante.
                </p>
            </div>

            {businesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                    <ShieldCheckIcon className="h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm font-semibold text-gray-700">No hay empresas</p>
                    <p className="mt-1 text-sm text-gray-500">
                        Crea una empresa antes de configurar accesos.
                    </p>
                </div>
            ) : (
                <AccessControl
                    businesses={businesses}
                    selectedBusinessId={selectedBusinessId}
                    initialAccesses={accesses.map((a) => ({
                        ...a,
                        createdAt: a.createdAt.toISOString(),
                        updatedAt: a.updatedAt.toISOString(),
                    }))}
                />
            )}
        </div>
    );
}
