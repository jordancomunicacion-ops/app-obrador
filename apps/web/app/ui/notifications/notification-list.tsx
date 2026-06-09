"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { markNotificationRead } from "@/app/lib/actions/notifications";

type NotificationType = "COMMUNICATION" | "CHECKLIST" | "INCIDENT" | "GENERIC";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  url: string | null;
  readAt: string | Date | null;
  createdAt: string | Date;
  /** true si el usuario actual es el destinatario (puede marcarla leída). */
  isOwn: boolean;
  /** Nombre del destinatario cuando NO es propia (vista de supervisión). */
  recipientName: string | null;
  /** Etiqueta de área (Sala/Cocina/General) para la vista de supervisión. */
  deptLabel: string;
  /** Nombre del local (vista de supervisión). */
  locationName: string | null;
};

const TYPE_META: Record<NotificationType, { icon: any; color: string }> = {
  COMMUNICATION: { icon: ChatBubbleLeftRightIcon, color: "text-sky-600 bg-sky-50" },
  CHECKLIST: { icon: ClipboardDocumentCheckIcon, color: "text-emerald-600 bg-emerald-50" },
  INCIDENT: { icon: ExclamationTriangleIcon, color: "text-red-600 bg-red-50" },
  GENERIC: { icon: BellIcon, color: "text-gray-500 bg-gray-100" },
};

export default function NotificationList({
  items,
  showDepartment = false,
}: {
  items: NotificationItem[];
  showDepartment?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Ids propios marcados como leídos localmente (feedback inmediato).
  const [readNow, setReadNow] = useState<Set<string>>(new Set());

  function handleOpen(n: NotificationItem) {
    // Sólo las propias se marcan como leídas (la lectura es del destinatario).
    if (n.isOwn && !n.readAt && !readNow.has(n.id)) {
      setReadNow((prev) => new Set(prev).add(n.id));
      startTransition(async () => {
        await markNotificationRead(n.id);
        if (!n.url) router.refresh();
      });
    }
    if (n.url) router.push(n.url);
  }

  return (
    <div className="space-y-2">
      {items.map((n) => {
        const meta = TYPE_META[n.type] ?? TYPE_META.GENERIC;
        const Icon = meta.icon;
        // El resaltado "sin leer" sólo aplica a las propias.
        const isUnread = n.isOwn && !n.readAt && !readNow.has(n.id);
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => handleOpen(n)}
            className={`w-full text-left flex items-start gap-3 rounded-xl border p-4 transition-colors hover:shadow-md hover:border-[var(--accent)] ${
              isUnread
                ? "bg-[var(--accent-soft)]/40 border-[var(--accent)]/40"
                : "bg-white border-gray-200"
            }`}
          >
            <div className={`p-2 rounded-lg flex-none ${meta.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-none" />
                )}
                <h3
                  className={`truncate ${
                    isUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"
                  }`}
                >
                  {n.title}
                </h3>
                {showDepartment && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-none">
                    {n.locationName ? `${n.locationName} · ${n.deptLabel}` : n.deptLabel}
                  </span>
                )}
              </div>
              {n.body && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
              <div className="text-xs text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                <span>
                  {new Date(n.createdAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {!n.isOwn && n.recipientName && (
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <UserIcon className="w-3 h-3" />
                    para {n.recipientName}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
