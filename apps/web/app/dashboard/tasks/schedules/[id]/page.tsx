import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ScheduleForm from "@/app/ui/tasks/schedule-form";
import { deleteSchedule } from "@/app/lib/actions/checklist-schedules";

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const schedule = await prisma.checklistSchedule.findFirst({
    where: { id, ownerId: orgId },
  });
  if (!schedule) notFound();

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

  const deleteAction = deleteSchedule.bind(null, schedule.id);

  return (
    <div>
      <Link
        href="/dashboard/tasks/schedules"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a programaciones
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Editar programación</h2>
        <form action={deleteAction}>
          <button
            type="submit"
            className="text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Eliminar
          </button>
        </form>
      </div>

      <ScheduleForm
        templates={templates}
        locations={locations}
        users={users}
        availableRoles={["ADMIN", "USER", "VET"]}
        initial={{
          id: schedule.id,
          templateId: schedule.templateId,
          locationId: schedule.locationId,
          frequency: schedule.frequency,
          startDate: schedule.startDate.toISOString().slice(0, 10),
          endDate: schedule.endDate ? schedule.endDate.toISOString().slice(0, 10) : "",
          executionStartTime: schedule.executionStartTime,
          executionEndTime: schedule.executionEndTime,
          excludeWeekdays: schedule.excludeWeekdays,
          autoClose: schedule.autoClose,
          pinned: schedule.pinned,
          performerUserIds: schedule.performerUserIds,
          supervisorUserIds: schedule.supervisorUserIds,
          followerUserIds: schedule.followerUserIds,
          performerRoles: schedule.performerRoles,
          supervisorRoles: schedule.supervisorRoles,
          followerRoles: schedule.followerRoles,
        }}
      />
    </div>
  );
}
