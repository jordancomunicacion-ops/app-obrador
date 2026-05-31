import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
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

const TYPE_META: Record<CommunicationType, { label: string; icon: any; color: string }> = {
  BREAKDOWN: { label: "Avería", icon: WrenchScrewdriverIcon, color: "text-red-600 bg-red-50" },
  NOTICE: { label: "Aviso", icon: MegaphoneIcon, color: "text-amber-600 bg-amber-50" },
  EVENT: { label: "Evento", icon: CalendarIcon, color: "text-indigo-600 bg-indigo-50" },
  MEETING: { label: "Reunión", icon: UserGroupIcon, color: "text-sky-600 bg-sky-50" },
  TASK: { label: "Programada", icon: ClockIcon, color: "text-violet-600 bg-violet-50" },
  LIST: { label: "Lista", icon: ListBulletIcon, color: "text-emerald-600 bg-emerald-50" },
};

const STATUS_CLS = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  CLOSED: "bg-gray-100 text-gray-600",
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

  const items = await prisma.communication.findMany({
    where: {
      ownerId: orgId,
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      ...(typeFilter && TYPE_META[typeFilter] ? { type: typeFilter } : {}),
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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-gray-800">Comunicaciones</h1>
        <Link
          href="/dashboard/communications/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva
        </Link>
      </div>

      <CommunicationTypeTabs />

      {items.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-lg">
          <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">No hay comunicaciones en esta vista.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const meta = TYPE_META[c.type];
            const Icon = meta.icon;
            return (
              <Link
                key={c.id}
                href={`/dashboard/communications/${c.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-none ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">
                        {meta.label}
                      </p>
                      <span
                        className={clsx(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          STATUS_CLS[c.status],
                        )}
                      >
                        {c.status === "OPEN" ? "Abierta" : c.status === "IN_PROGRESS" ? "En curso" : "Cerrada"}
                      </span>
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
