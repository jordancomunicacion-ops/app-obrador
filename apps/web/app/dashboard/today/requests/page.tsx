import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import RequestForm from "@/app/ui/today/request-form";
import MyRequestRow from "@/app/ui/today/my-request-row";

export default async function MyRequestsPage() {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) return null;

  const requests = await prisma.employeeRequest.findMany({
    where: { ownerId: orgId, workerId: session.user.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard/today"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="text-xl font-semibold text-gray-800 mb-4">Mis solicitudes</h1>

      <div className="mb-6">
        <RequestForm />
      </div>

      {requests.length === 0 ? (
        <p className="text-center text-gray-500 italic p-8">No tienes solicitudes.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <MyRequestRow
              key={r.id}
              request={{
                id: r.id,
                type: r.type,
                status: r.status,
                startDate: r.startDate.toISOString(),
                endDate: r.endDate?.toISOString() ?? null,
                reason: r.reason,
                decision: r.decision,
                resolvedAt: r.resolvedAt?.toISOString() ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
