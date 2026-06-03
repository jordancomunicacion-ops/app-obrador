import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CommunicationForm from "@/app/ui/communications/communication-form";

export default async function EditCommunicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const c = await prisma.communication.findFirst({
    where: { id, businessId: orgId },
  });
  if (!c) notFound();

  const [locations, users] = await Promise.all([
    prisma.location.findMany({
      where: { businessId: orgId, isActive: true },
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
        href={`/dashboard/communications/${c.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Editar comunicación</h1>
      <CommunicationForm
        locations={locations}
        users={users}
        initial={{
          id: c.id,
          type: c.type,
          title: c.title,
          description: c.description ?? "",
          locationId: c.locationId ?? "",
          assigneeIds: c.assigneeIds,
          followerIds: c.followerIds,
          scheduledAt: c.scheduledAt
            ? new Date(c.scheduledAt).toISOString().slice(0, 16)
            : "",
          photoUrls: c.photoUrls,
        }}
      />
    </div>
  );
}
