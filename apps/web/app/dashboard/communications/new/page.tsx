import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CommunicationForm from "@/app/ui/communications/communication-form";
import { getAllowedRecipients, getViewerContext } from "@/app/lib/auth/viewer";

export default async function NewCommunicationPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  // El trabajador sólo puede dirigirse a sus encargados/dirección y a sus
  // locales asignados; dirección y encargados eligen a cualquiera.
  const viewer = await getViewerContext();
  const [locations, users] = await Promise.all([
    prisma.location.findMany({
      where: {
        businessId: orgId,
        isActive: true,
        ...(!viewer.isManager && !viewer.isSupervisor && viewer.locationIds.length > 0
          ? { id: { in: viewer.locationIds } }
          : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getAllowedRecipients(viewer),
  ]);

  return (
    <div>
      <Link
        href="/dashboard/communications"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Nueva comunicación</h1>
      <CommunicationForm locations={locations} users={users} />
    </div>
  );
}
