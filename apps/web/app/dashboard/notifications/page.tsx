import { prisma } from "@/app/lib/prisma";
import { BellIcon, BellAlertIcon } from "@heroicons/react/24/outline";
import PageHeader from "@/app/ui/primitives/page-header";
import EmptyState from "@/app/ui/primitives/empty-state";
import NotificationList from "@/app/ui/notifications/notification-list";
import { getNotificationVisibility } from "@/app/lib/notifications/visibility";

const DEPT_LABEL: Record<string, string> = {
  SALA: "Sala",
  COCINA: "Cocina",
  GENERAL: "General",
};

export default async function NotificationsPage() {
  const { where, currentUserId, isSupervisorView } = await getNotificationVisibility();
  if (!where || !currentUserId) return null;

  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { id: true, name: true, firstName: true, lastName: true } } },
  });

  // Nombres de local (locationId es columna suelta, sin relación) para la vista de supervisión.
  const locationIds = Array.from(
    new Set(rows.map((n) => n.locationId).filter((id): id is string => !!id)),
  );
  const locations = locationIds.length
    ? await prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, name: true },
      })
    : [];
  const locationName = new Map(locations.map((l) => [l.id, l.name]));

  // Propias = el usuario es el destinatario (las únicas que puede marcar leídas).
  const items = rows.map((n) => {
    const isOwn = n.userId === currentUserId;
    const recipientName = isOwn
      ? null
      : [n.user?.firstName, n.user?.lastName].filter(Boolean).join(" ") ||
        n.user?.name ||
        "—";
    return {
      id: n.id,
      type: n.type,
      department: n.department,
      title: n.title,
      body: n.body,
      url: n.url,
      readAt: n.readAt,
      createdAt: n.createdAt,
      isOwn,
      recipientName,
      deptLabel: DEPT_LABEL[n.department] ?? n.department,
      locationName: n.locationId ? locationName.get(n.locationId) ?? null : null,
    };
  });

  const unreadOwn = items.filter((n) => n.isOwn && !n.readAt).length;

  return (
    <div>
      <PageHeader
        icon={<BellIcon className="w-6 h-6" />}
        title="Notificaciones"
        description={
          isSupervisorView
            ? `Vista de supervisión · ${items.length} en total${unreadOwn > 0 ? ` · ${unreadOwn} tuyas sin leer` : ""}`
            : unreadOwn > 0
              ? `${unreadOwn} sin leer`
              : "Todo al día"
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<BellAlertIcon className="w-12 h-12" />}
          title="No tienes notificaciones."
          description="Aquí aparecerán avisos, incidencias y cambios que te afecten."
        />
      ) : (
        <NotificationList items={items} showDepartment={isSupervisorView} />
      )}
    </div>
  );
}
