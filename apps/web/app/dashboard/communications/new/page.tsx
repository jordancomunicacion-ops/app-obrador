import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CommunicationForm from "@/app/ui/communications/communication-form";

export default async function NewCommunicationPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const [locations, users] = await Promise.all([
    prisma.location.findMany({
      where: { ownerId: orgId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { OR: [{ id: orgId }, { adminId: orgId }] },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
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
