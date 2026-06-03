import { redirect } from "next/navigation";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { auth } from "@/auth";
import { isPlatformOwner } from "@/app/lib/auth/platform";
import CreateBusinessForm from "@/app/ui/accounts/create-business-form";

/**
 * Alta de cuenta de negocio. Solo accesible para el propietario de plataforma
 * (SUPERADMIN). El resto se redirige fuera.
 */
export default async function Page() {
    const session = await auth();
    if (!isPlatformOwner(session)) {
        redirect("/dashboard");
    }

    return (
        <div className="mx-auto w-full max-w-2xl p-4 md:p-8">
            <div className="mb-8">
                <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-gray-900">
                    <BuildingOffice2Icon className="h-7 w-7 text-indigo-600" />
                    Crear negocio
                </h1>
                <p className="mt-1 text-base text-gray-500">
                    Da de alta una cuenta cliente (restaurante/obrador) y su primer local. El cliente
                    accederá con el email y la contraseña que indiques.
                </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                <CreateBusinessForm />
            </div>
        </div>
    );
}
