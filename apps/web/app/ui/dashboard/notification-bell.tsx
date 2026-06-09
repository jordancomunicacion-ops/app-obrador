import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import { getUnreadNotificationCount } from "@/app/lib/actions/notifications";

/**
 * Campana del TopBar con el contador de notificaciones sin leer. Se renderiza en
 * cada carga del layout (dinámico, por sesión), así que el número está siempre
 * al día. Al abrir la bandeja, ésta marca todo como leído y el badge se vacía.
 */
export default async function NotificationBell() {
  const count = await getUnreadNotificationCount();

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={count > 0 ? `${count} notificaciones sin leer` : "Notificaciones"}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
    >
      <BellIcon className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[var(--accent)] text-white text-[11px] font-bold leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
