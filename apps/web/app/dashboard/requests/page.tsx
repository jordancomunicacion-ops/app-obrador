import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import AdminRequestRow from "@/app/ui/requests/admin-request-row";

export default async function RequestsAdminPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const all = await prisma.employeeRequest.findMany({
    where: { ownerId: orgId },
    include: {
      worker: { select: { name: true } },
      resolver: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const pending = all.filter((r) => r.status === "PENDING");
  const resolved = all.filter((r) => r.status !== "PENDING");

  const toView = (r: typeof all[number]) => ({
    id: r.id,
    workerName: r.worker.name,
    type: r.type,
    status: r.status,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate?.toISOString() ?? null,
    reason: r.reason,
    decision: r.decision,
    resolverName: r.resolver?.name ?? null,
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Solicitudes</h1>
      <p className="text-sm text-gray-500 mb-6">
        Vacaciones, bajas, asuntos propios y cambios de turno del personal
      </p>

      <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
        Pendientes ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p className="text-sm text-gray-500 italic mb-6">No hay solicitudes pendientes 🎉</p>
      ) : (
        <div className="space-y-2 mb-6">
          {pending.map((r) => (
            <AdminRequestRow key={r.id} request={toView(r)} />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Resueltas ({resolved.length})
          </h2>
          <div className="space-y-2 opacity-80">
            {resolved.map((r) => (
              <AdminRequestRow key={r.id} request={toView(r)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
