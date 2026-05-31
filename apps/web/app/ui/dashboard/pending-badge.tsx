import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

function startOfDayUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export default async function PendingBadge() {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) return null;

  const userId = session.user.id;
  const role = (session.user as any).role ?? "USER";
  const locationId = await currentLocationId();
  const today = startOfDayUTC();

  const count = await prisma.checklistInstance.count({
    where: {
      dueDate: today,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      schedule: {
        ownerId: orgId,
        ...(locationId ? { locationId } : {}),
        OR: [
          { performerUserIds: { has: userId } },
          { performerRoles: { has: role } },
        ],
      },
    },
  });

  if (count === 0) return null;

  return (
    <Link
      href="/dashboard/today"
      className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
    >
      <ClipboardDocumentCheckIcon className="w-4 h-4" />
      <span>
        {count} {count === 1 ? "pendiente" : "pendientes"} hoy
      </span>
    </Link>
  );
}
