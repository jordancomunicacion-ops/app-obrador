import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/lib/auth/location";
import { generateInstancesForDate } from "@/app/lib/actions/checklist-instances";
import {
  ClockIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

function startOfDayUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
function endOfDayUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const orgId = await currentOrgId();
  if (!orgId) return null;

  // 1. Generar instancias del día (lazy, idempotente)
  await generateInstancesForDate(new Date(), orgId);

  const userId = session.user.id;
  const role = (session.user as any).role ?? "USER";
  const locationId = await currentLocationId();
  const todayStart = startOfDayUTC();
  const todayEnd = endOfDayUTC();

  // 2. Tareas de producción asignadas a mí, para hoy
  const productionTasks = await prisma.task.findMany({
    where: {
      ownerId: orgId,
      assignedToUserId: userId,
      OR: [
        { plannedStart: { gte: todayStart, lte: todayEnd } },
        { plannedStart: null, status: { in: ["PENDING", "IN_PROGRESS"] } },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      plannedStart: true,
      targetQuantity: true,
      unit: true,
      recipe: { select: { name: true } },
    },
    orderBy: { plannedStart: "asc" },
  });

  // 3. Checklists del día asignadas a mí (como ejecutor)
  const checklistInstances = await prisma.checklistInstance.findMany({
    where: {
      dueDate: todayStart,
      schedule: {
        ownerId: orgId,
        ...(locationId ? { locationId } : {}),
        OR: [
          { performerUserIds: { has: userId } },
          { performerRoles: { has: role } },
        ],
      },
    },
    include: {
      schedule: {
        select: {
          executionStartTime: true,
          executionEndTime: true,
          pinned: true,
          template: { select: { name: true, description: true } },
          location: { select: { name: true, shortCode: true } },
        },
      },
      _count: { select: { responses: true } },
    },
    orderBy: [{ schedule: { pinned: "desc" } }, { schedule: { executionStartTime: "asc" } }],
  });

  // 4. Comunicaciones abiertas asignadas a mí (averías, avisos…)
  const openCommunications = await prisma.communication.count({
    where: {
      ownerId: orgId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
      OR: [
        { assigneeIds: { has: userId } },
        { followerIds: { has: userId } },
        { authorId: userId },
      ],
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
    },
  });

  // 5. Contar campos de cada plantilla para mostrar progreso
  const templateIds = Array.from(
    new Set(checklistInstances.map((i) => i.schedule.template.name)),
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Mis tareas hoy</h1>
      <p className="text-sm text-gray-500 mb-6">
        {new Date().toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      {openCommunications > 0 && (
        <Link
          href="/dashboard/communications"
          className="flex items-center justify-between bg-amber-50 border-2 border-amber-200 rounded-xl p-3 mb-4 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-amber-700" />
            <span className="text-sm font-medium text-amber-800">
              {openCommunications}{" "}
              {openCommunications === 1 ? "comunicación" : "comunicaciones"} para ti
            </span>
          </div>
          <span className="text-xs text-amber-700">Abrir →</span>
        </Link>
      )}

      {productionTasks.length === 0 && checklistInstances.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-lg">
          <CheckCircleIcon className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">No tienes tareas pendientes hoy.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {checklistInstances.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Checklists ({checklistInstances.length})
              </h2>
              <div className="space-y-2">
                {checklistInstances.map((inst) => (
                  <ChecklistCard key={inst.id} instance={inst} />
                ))}
              </div>
            </section>
          )}

          {productionTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
                Producción ({productionTasks.length})
              </h2>
              <div className="space-y-2">
                {productionTasks.map((t) => (
                  <ProductionTaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

type ChecklistInst = {
  id: string;
  status: string;
  scoreAvg: number | null;
  _count: { responses: number };
  schedule: {
    executionStartTime: string;
    executionEndTime: string;
    pinned: boolean;
    template: { name: string; description: string | null };
    location: { name: string; shortCode: string | null };
  };
};

function ChecklistCard({ instance }: { instance: ChecklistInst }) {
  const statusMeta: Record<string, { label: string; cls: string; icon: any }> = {
    PENDING: { label: "Pendiente", cls: "text-gray-600 bg-gray-100", icon: PlayCircleIcon },
    IN_PROGRESS: { label: "En curso", cls: "text-amber-700 bg-amber-100", icon: PlayCircleIcon },
    DONE: { label: "Completado", cls: "text-green-700 bg-green-100", icon: CheckCircleIcon },
    INCIDENT: {
      label: "Incidencia",
      cls: "text-red-700 bg-red-100",
      icon: ExclamationTriangleIcon,
    },
    CLOSED_AUTO: { label: "Cerrada auto", cls: "text-gray-500 bg-gray-100", icon: ClockIcon },
  };
  const meta = statusMeta[instance.status] ?? statusMeta.PENDING;
  const Icon = meta.icon;

  return (
    <Link
      href={`/dashboard/today/checklist/${instance.id}`}
      className={clsx(
        "block bg-white border-2 rounded-xl p-4 hover:shadow-md transition-all active:scale-[0.99]",
        instance.status === "DONE"
          ? "border-green-200 bg-green-50/30"
          : instance.status === "INCIDENT"
            ? "border-red-200"
            : "border-gray-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {instance.schedule.pinned && (
              <span className="text-xs text-indigo-600 font-semibold">📌</span>
            )}
            <h3 className="font-semibold text-gray-800 truncate">
              {instance.schedule.template.name}
            </h3>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span>{instance.schedule.location.name}</span>
            <span>·</span>
            <ClockIcon className="w-3.5 h-3.5" />
            <span>
              {instance.schedule.executionStartTime}–{instance.schedule.executionEndTime}
            </span>
          </p>
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-none",
            meta.cls,
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {meta.label}
        </span>
      </div>
      {instance._count.responses > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {instance._count.responses} {instance._count.responses === 1 ? "respuesta" : "respuestas"}
          {instance.scoreAvg !== null && ` · valoración media ${instance.scoreAvg.toFixed(1)}/10`}
        </p>
      )}
    </Link>
  );
}

type ProdTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  plannedStart: Date | null;
  targetQuantity: number | null;
  unit: string | null;
  recipe: { name: string } | null;
};

function ProductionTaskCard({ task }: { task: ProdTask }) {
  const statusCls: Record<string, string> = {
    PENDING: "text-gray-600 bg-gray-100",
    IN_PROGRESS: "text-amber-700 bg-amber-100",
    DONE: "text-green-700 bg-green-100",
    ISSUE: "text-red-700 bg-red-100",
  };
  return (
    <Link
      href={`/dashboard/tasks/board?focus=${task.id}`}
      className="block bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
          {task.recipe && (
            <p className="text-xs text-gray-500">Receta: {task.recipe.name}</p>
          )}
          {task.targetQuantity && (
            <p className="text-xs text-gray-700 mt-1">
              Objetivo: {task.targetQuantity} {task.unit ?? "ud"}
            </p>
          )}
        </div>
        <span
          className={clsx(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-none",
            statusCls[task.status] ?? "bg-gray-100 text-gray-600",
          )}
        >
          {task.status}
        </span>
      </div>
    </Link>
  );
}
