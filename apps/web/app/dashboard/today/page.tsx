import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { generateInstancesForDate } from "@/app/lib/actions/checklist-instances";
import ProductionList from "@/app/ui/today/production-list";
import PageHeader from "@/app/ui/primitives/page-header";
import Badge from "@/app/ui/primitives/badge";
import EmptyState from "@/app/ui/primitives/empty-state";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
  TruckIcon,
  TagIcon,
  SunIcon,
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
      businessId: orgId,
      assignedToUserId: userId,
      OR: [
        { plannedStart: { gte: todayStart, lte: todayEnd } },
        { plannedStart: null, status: { in: ["PENDING", "IN_PROGRESS"] } },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      targetQuantity: true,
      unit: true,
      recipe: { select: { name: true, category: true } },
    },
    orderBy: [{ sortOrder: { sort: "asc", nulls: "last" } }, { plannedStart: "asc" }],
  });

  // 3. Checklists del día (asignadas a mí, o del pool si están sin asignar)
  const checklistInstances = await prisma.checklistInstance.findMany({
    where: {
      dueDate: todayStart,
      schedule: { businessId: orgId, ...(locationId ? { locationId } : {}) },
      OR: [
        { assignedToUserId: userId },
        { assignedToUserId: null, schedule: { performerUserIds: { has: userId } } },
        { assignedToUserId: null, schedule: { performerRoles: { has: role } } },
      ],
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

  const pendingDeliveries = await prisma.purchaseOrder.count({
    where: { businessId: orgId, status: "SENT" },
  });

  const openCommunications = await prisma.communication.count({
    where: {
      businessId: orgId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
      OR: [
        { assigneeIds: { has: userId } },
        { followerIds: { has: userId } },
        { authorId: userId },
      ],
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
    },
  });

  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        icon={<SunIcon className="w-6 h-6" />}
        title="Mis tareas hoy"
        description={fecha.charAt(0).toUpperCase() + fecha.slice(1)}
      />

      {/* Accesos rápidos / avisos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        {openCommunications > 0 && (
          <QuickTile
            href="/dashboard/communications"
            icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
            tone="amber"
            label={`${openCommunications} ${
              openCommunications === 1 ? "comunicación" : "comunicaciones"
            } para ti`}
          />
        )}
        {pendingDeliveries > 0 && (
          <QuickTile
            href="/dashboard/today/deliveries"
            icon={<TruckIcon className="w-5 h-5" />}
            tone="violet"
            label={`${pendingDeliveries} pedido${pendingDeliveries === 1 ? "" : "s"} por recibir`}
          />
        )}
        <QuickTile
          href="/dashboard/today/labels"
          icon={<TagIcon className="w-5 h-5" />}
          tone="accent"
          label="Etiqueta rápida"
        />
      </div>

      {productionTasks.length === 0 && checklistInstances.length === 0 ? (
        <EmptyState
          icon={<CheckCircleIcon className="w-12 h-12" />}
          title="No tienes tareas pendientes hoy."
          description="Cuando se generen checklists o se te asignen tareas, aparecerán aquí."
        />
      ) : (
        <div className="space-y-6">
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
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Producción ({productionTasks.length})
              </h2>
              <ProductionList tasks={productionTasks} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function QuickTile({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tone: "amber" | "violet" | "accent";
}) {
  const tones = {
    amber: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
    violet: "bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100",
    accent:
      "bg-white border-gray-200 text-gray-700 hover:border-[var(--accent)] hover:bg-gray-50",
  }[tone];
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center justify-between rounded-xl border-2 p-3 transition-colors",
        tones,
      )}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="flex-none">{icon}</span>
        <span className="text-sm font-medium truncate">{label}</span>
      </span>
      <span className="text-xs opacity-70">→</span>
    </Link>
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

const STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "warning" | "success" | "danger"; icon: any }
> = {
  PENDING: { label: "Pendiente", tone: "neutral", icon: PlayCircleIcon },
  IN_PROGRESS: { label: "En curso", tone: "warning", icon: PlayCircleIcon },
  DONE: { label: "Completado", tone: "success", icon: CheckCircleIcon },
  INCIDENT: { label: "Incidencia", tone: "danger", icon: ExclamationTriangleIcon },
  CLOSED_AUTO: { label: "Cerrada auto", tone: "neutral", icon: ClockIcon },
};

function ChecklistCard({ instance }: { instance: ChecklistInst }) {
  const meta = STATUS_META[instance.status] ?? STATUS_META.PENDING;
  const Icon = meta.icon;

  return (
    <Link
      href={`/dashboard/today/checklist/${instance.id}`}
      className={clsx(
        "block bg-white border rounded-xl p-4 transition-all hover:shadow-md active:scale-[0.99]",
        instance.status === "DONE"
          ? "border-green-200 bg-green-50/30"
          : instance.status === "INCIDENT"
            ? "border-red-200"
            : "border-gray-200 hover:border-[var(--accent)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {instance.schedule.pinned && (
              <span className="text-xs text-[var(--accent-soft-contrast)] font-semibold">📌</span>
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
        <Badge tone={meta.tone}>
          <Icon className="w-3.5 h-3.5" />
          {meta.label}
        </Badge>
      </div>
      {instance._count.responses > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {instance._count.responses}{" "}
          {instance._count.responses === 1 ? "respuesta" : "respuestas"}
          {instance.scoreAvg !== null && ` · valoración media ${instance.scoreAvg.toFixed(1)}/10`}
        </p>
      )}
    </Link>
  );
}
