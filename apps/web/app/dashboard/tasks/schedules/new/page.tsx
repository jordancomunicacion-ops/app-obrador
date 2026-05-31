import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ScheduleForm from "@/app/ui/tasks/schedule-form";

async function loadFormData(orgId: string) {
  const [templates, locations, users] = await Promise.all([
    prisma.checklistTemplate.findMany({
      where: { ownerId: orgId, isActive: true },
      select: { id: true, name: true, locationId: true },
      orderBy: { name: "asc" },
    }),
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
  return { templates, locations, users };
}

export default async function NewSchedulePage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const { templates, locations, users } = await loadFormData(orgId);

  return (
    <div>
      <Link
        href="/dashboard/tasks/schedules"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a programaciones
      </Link>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Nueva programación</h2>

      {templates.length === 0 || locations.length === 0 ? (
        <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-4">
          Necesitas al menos una plantilla activa y un local activo para crear una programación.
        </p>
      ) : (
        <ScheduleForm
          templates={templates}
          locations={locations}
          users={users}
          availableRoles={["ADMIN", "USER", "VET"]}
        />
      )}
    </div>
  );
}
