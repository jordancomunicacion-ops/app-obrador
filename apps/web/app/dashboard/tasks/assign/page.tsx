import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { ClipboardDocumentCheckIcon, ClockIcon } from "@heroicons/react/24/outline";
import AssignInstanceControl from "@/app/ui/tasks/assign-instance-control";

function startOfDayUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export default async function AssignTasksPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const userId = session.user.id;
  const role = (session.user as any).role ?? "USER";
  const locationId = await currentLocationId();
  const isOwner = userId === orgId;

  const todayStart = startOfDayUTC();
  const tomorrowEnd = startOfDayUTC();
  tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);
  tomorrowEnd.setUTCHours(23, 59, 59, 999);

  // Solo el propietario/admin o un supervisor pueden asignar.
  const scheduleWhere: any = { businessId: orgId, ...(locationId ? { locationId } : {}) };
  if (!isOwner) {
    scheduleWhere.OR = [
      { supervisorUserIds: { has: userId } },
      { supervisorRoles: { has: role } },
    ];
  }

  const [instances, users] = await Promise.all([
    prisma.checklistInstance.findMany({
      where: {
        status: "PENDING",
        dueDate: { lte: tomorrowEnd },
        schedule: scheduleWhere,
      },
      include: {
        schedule: {
          select: {
            executionStartTime: true,
            executionEndTime: true,
            performerUserIds: true,
            performerRoles: true,
            template: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
      },
      orderBy: [{ dueDate: "asc" }, { schedule: { executionStartTime: "asc" } }],
      take: 200,
    }),
    prisma.user.findMany({
      where: { OR: [{ id: orgId }, { adminId: orgId }] },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="w-6 h-6" />
          Asignar tareas pendientes
        </h1>
        <div className="flex gap-2 text-sm">
          <Link href="/dashboard/tasks/supervise" className="text-indigo-600 hover:underline">
            Supervisar
          </Link>
          <Link href="/dashboard/tasks/schedules" className="text-indigo-600 hover:underline">
            Programaciones
          </Link>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Instancias pendientes (hoy, vencidas y de mañana). Asigna cada una a una persona; recibirá
        un aviso y la verá en su pantalla de “Hoy”.
      </p>

      {instances.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
          No hay tareas pendientes por asignar.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Plantilla</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Horario</th>
                <th className="px-4 py-3">Ejecutores</th>
                <th className="px-4 py-3">Asignar a</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {instances.map((i) => {
                const overdue = new Date(i.dueDate) < todayStart;
                const performerNames = i.schedule.performerUserIds
                  .map((id) => nameById.get(id))
                  .filter(Boolean) as string[];
                const pool = [...performerNames, ...i.schedule.performerRoles];
                return (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className={clsx("px-4 py-3 text-xs", overdue ? "text-red-600 font-semibold" : "text-gray-600")}>
                      {new Date(i.dueDate).toLocaleDateString("es-ES")}
                      {overdue && " ⚠"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {i.schedule.template.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{i.schedule.location.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {i.schedule.executionStartTime}–{i.schedule.executionEndTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {pool.length > 0 ? pool.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AssignInstanceControl
                        instanceId={i.id}
                        assignedToUserId={i.assignedToUserId}
                        users={users}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
