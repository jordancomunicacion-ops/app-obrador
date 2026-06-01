import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default async function SupervisePage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const userId = session.user.id;
  const role = (session.user as any).role ?? "USER";
  const locationId = await currentLocationId();
  const isOwner = userId === orgId;

  // El admin ve todo; un supervisor ve solo las instancias que supervisa
  const baseWhere: any = {
    schedule: {
      ownerId: orgId,
      ...(locationId ? { locationId } : {}),
    },
    status: { in: ["IN_PROGRESS", "DONE", "INCIDENT"] },
  };
  if (!isOwner) {
    baseWhere.schedule.OR = [
      { supervisorUserIds: { has: userId } },
      { supervisorRoles: { has: role } },
    ];
  }

  const instances = await prisma.checklistInstance.findMany({
    where: baseWhere,
    include: {
      schedule: {
        select: {
          template: { select: { name: true } },
          location: { select: { name: true } },
        },
      },
      responses: { select: { id: true, supervisedAt: true, isIncident: true } },
    },
    orderBy: { dueDate: "desc" },
    take: 100,
  });

  const enriched = instances.map((i) => {
    const total = i.responses.length;
    const supervised = i.responses.filter((r) => r.supervisedAt !== null).length;
    const incidents = i.responses.filter((r) => r.isIncident).length;
    return { ...i, total, supervised, incidents };
  });

  const pending = enriched.filter((i) => i.supervised < i.total);
  const done = enriched.filter((i) => i.total > 0 && i.supervised === i.total);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-gray-800">Supervisión</h1>
        <Link
          href="/dashboard/tasks/assign"
          className="text-sm text-indigo-600 hover:underline"
        >
          Asignar pendientes →
        </Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <SummaryCard label="Total" value={enriched.length} color="gray" />
        <SummaryCard label="Pendientes de supervisar" value={pending.length} color="amber" />
        <SummaryCard label="Supervisadas total." value={done.length} color="green" />
      </div>

      {pending.length === 0 && done.length === 0 ? (
        <p className="text-center text-gray-500 italic p-12 border-2 border-dashed border-gray-200 rounded-lg">
          No hay instancias para supervisar en este local.
        </p>
      ) : (
        <>
          {pending.length > 0 && (
            <Section title={`Pendientes (${pending.length})`} items={pending} />
          )}
          {done.length > 0 && (
            <Section title={`Completadas (${done.length})`} items={done} muted />
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gray" | "amber" | "green";
}) {
  const colorCls = {
    gray: "border-gray-200 text-gray-800",
    amber: "border-amber-300 text-amber-800 bg-amber-50",
    green: "border-green-300 text-green-800 bg-green-50",
  }[color];
  return (
    <div className={clsx("bg-white border-2 rounded-xl p-4", colorCls)}>
      <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Section({
  title,
  items,
  muted,
}: {
  title: string;
  items: any[];
  muted?: boolean;
}) {
  return (
    <section className={clsx("mb-6", muted && "opacity-70")}>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Plantilla</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Respuestas</th>
              <th className="px-4 py-3 text-center">Supervisadas</th>
              <th className="px-4 py-3 text-center">Incidencias</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((i) => {
              const statusCls = {
                IN_PROGRESS: "bg-amber-100 text-amber-700",
                DONE: "bg-green-100 text-green-700",
                INCIDENT: "bg-red-100 text-red-700",
                CLOSED_AUTO: "bg-gray-100 text-gray-600",
                PENDING: "bg-gray-100 text-gray-600",
              }[i.status as string];
              return (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(i.dueDate).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {i.schedule.template.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{i.schedule.location.name}</td>
                  <td className="px-4 py-3">
                    <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", statusCls)}>
                      {i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{i.total}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={clsx(
                        "text-sm font-medium",
                        i.supervised === i.total ? "text-green-600" : "text-amber-600",
                      )}
                    >
                      {i.supervised}/{i.total}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {i.incidents > 0 ? (
                      <span className="text-red-600 font-semibold inline-flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {i.incidents}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/tasks/supervise/${i.id}`}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-sm"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Revisar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
