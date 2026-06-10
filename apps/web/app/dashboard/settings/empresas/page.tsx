import { redirect } from "next/navigation";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import { prisma } from "@/app/lib/prisma";
import { BUSINESS_COOKIE } from "@/app/lib/auth/business";
import { cookies } from "next/headers";
import BusinessesManager from "@/app/ui/businesses/businesses-manager";

export const dynamic = "force-dynamic";

/**
 * Listado y CRUD de Empresas (negocios/marcas) — patrón CRM.
 *
 * - Super admin (gerencia): ve todas, puede crear/editar/eliminar.
 * - Resto: redirigido fuera (los usuarios estándar no entran aquí).
 */
export default async function EmpresasPage() {
    const session = await auth();
    if (!isPlatformOwner(session)) {
        redirect("/dashboard");
    }

    const businesses = await prisma.business.findMany({
        orderBy: { createdAt: "asc" },
        select: {
            id: true, name: true, domain: true, logoUrl: true, createdAt: true,
            locations: {
                orderBy: [{ isActive: "desc" }, { name: "asc" }],
                select: { id: true, name: true, isActive: true },
            },
        },
    });
    const cookieStore = await cookies();
    const currentId = cookieStore.get(BUSINESS_COOKIE)?.value ?? null;

    return (
        <div className="w-full space-y-8 p-4 md:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900">
                    <BuildingOffice2Icon className="h-7 w-7 text-indigo-600" />
                    Empresas
                </h1>
                <p className="text-base text-gray-500">
                    Negocios accesibles desde tu cuenta. Cambia la empresa activa, edita datos o crea / elimina desde aquí.
                </p>
            </div>

            <BusinessesManager
                initial={businesses.map((b) => ({
                    ...b,
                    createdAt: b.createdAt.toISOString(),
                }))}
                currentId={currentId}
            />
        </div>
    );
}
