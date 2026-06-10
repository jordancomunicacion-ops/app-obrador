import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { getViewerContext } from "@/app/lib/auth/viewer";
import CommunicationTypeTabs from "@/app/ui/communications/type-tabs";
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  MegaphoneIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import type { CommunicationType } from "@prisma/client";
import PageHeader from "@/app/ui/primitives/page-header";
import Button from "@/app/ui/primitives/button";
import Badge from "@/app/ui/primitives/badge";
import EmptyState from "@/app/ui/primitives/empty-state";

const TYPE_META: Record<CommunicationType, { label: string; icon: any; color: string }> = {
  BREAKDOWN: { label: "Avería", icon: WrenchScrewdriverIcon, color: "text-red-600 bg-red-50" },
  NOTICE: { label: "Aviso", icon: MegaphoneIcon, color: "text-amber-600 bg-amber-50" },
  EVENT: { label: "Evento", icon: CalendarIcon, color: "text-indigo-600 bg-indigo-50" },
  MEETING: { label: "Reunión", icon: UserGroupIcon, color: "text-sky-600 bg-sky-50" },
  TASK: { label: "Programada", icon: ClockIcon, color: "text-violet-600 bg-violet-50" },
  LIST: { label: "Lista", icon: ListBulletIcon, color: "text-emerald-600 bg-emerald-50" },
};

const STATUS_TONE: Record<string, "accent" | "warning" | "neutral"> = {
  OPEN: "accent",
  IN_PROGRESS: "warning",
  CLOSED: "neutral",
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En curso",
  CLOSED: "Cerrada",
};

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const locationId = await currentLocationId();
  const typeFilter = sp.type as CommunicationType | undefined;

  // Visibilidad por jerarquía: dirección ve todo; el encargado, lo suyo + sus
  // locales; el trabajador, SOLO las comunicaciones en las que participa
  // (autor, asignado o seguidor).
  const viewer = await getViewerContext();
  const involvement = [
    { authorId: viewer.userId ?? "__none__" },
    { assigneeIds: { has: viewer.userId ?? "__none__" } },
    { followerIds: { has: viewer.userId ?? "__none__" } },
  ];
  const visibility = viewer.isManager
    ? undefined
    : viewer.isSupervisor
      ? viewer.locationIds.length > 0
        ? { OR: [...involvement, { locationId: { in: viewer.locationIds } }, { locationId: null }] }
        : undefined // encargado sin locales asignados: todo el negocio (como notificaciones)
      : { OR: involvement };

  const items = await prisma.communication.findMany({
    where: {
      businessId: orgId,
      ...(typeFilter && TYPE_META[typeFilter] ? { type: typeFilter } : {}),
      AND: [
        ...(locationId ? [{ OR: [{ locationId }, { locationId: null }] }] : []),
        ...(visibility ? [visibility] : []),
      ],
    },
    include: {
      author: { select: { name: true } },
      location: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div>
      <PageHeader
        icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
        title="Comunicaciones"
        actions={
          <Button href="/dashboard/communications/new">
            <PlusIcon className="w-4 h-4" />
            Nueva
          </Button>
        }
      />

      <CommunicationTypeTabs />

      {items.length === 0 ? (
        <EmptyState
          icon={<ChatBubbleLeftRightIcon className="w-12 h-12" />}
          title="No hay comunicaciones en esta vista."
        />
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const meta = TYPE_META[c.type];
            const Icon = meta.icon;
            return (
              <Link
                key={c.id}
                href={`/dashboard/communications/${c.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-[var(--accent)] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-none ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{meta.label}</p>
                      <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                      {c.photoUrls.length > 0 && (
                        <span className="text-xs text-gray-400">📷 {c.photoUrls.length}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 truncate">{c.title}</h3>
                    {c.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                      <span>{c.author.name}</span>
                      {c.location && (
                        <>
                          <span>·</span>
                          <span>{c.location.name}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(c.createdAt).toLocaleDateString("es-ES")}</span>
                      {c._count.comments > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            💬 {c._count.comments}{" "}
                            {c._count.comments === 1 ? "comentario" : "comentarios"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
