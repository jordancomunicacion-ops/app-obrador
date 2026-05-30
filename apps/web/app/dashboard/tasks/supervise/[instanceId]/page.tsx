import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import SuperviseDetail from "@/app/ui/tasks/supervise-detail";

export default async function SuperviseInstancePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const instance = await prisma.checklistInstance.findFirst({
    where: { id: instanceId, schedule: { ownerId: orgId } },
    include: {
      schedule: {
        include: {
          template: {
            include: { fields: { orderBy: { order: "asc" } } },
          },
          location: { select: { name: true } },
        },
      },
      responses: {
        include: {
          answeredBy: { select: { name: true } },
          supervisedBy: { select: { name: true } },
        },
      },
    },
  });
  if (!instance) notFound();

  const responsesByField = new Map(instance.responses.map((r) => [r.fieldId, r]));

  const rows = instance.schedule.template.fields.map((f) => {
    const r = responsesByField.get(f.id);
    return {
      fieldId: f.id,
      fieldName: f.name,
      fieldType: f.type,
      fieldOrder: f.order,
      responseId: r?.id ?? null,
      valueText: r?.valueText ?? null,
      valueBool: r?.valueBool ?? null,
      valueRating: r?.valueRating ?? null,
      photoUrl: r?.photoUrl ?? null,
      isIncident: r?.isIncident ?? false,
      incidentNote: r?.incidentNote ?? null,
      supervisedAt: r?.supervisedAt ?? null,
      supervisedByName: r?.supervisedBy?.name ?? null,
      answeredByName: r?.answeredBy?.name ?? null,
    };
  });

  return (
    <div>
      <Link
        href="/dashboard/tasks/supervise"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a supervisión
      </Link>
      <h2 className="text-xl font-semibold text-gray-800">
        {instance.schedule.template.name}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {instance.schedule.location.name} ·{" "}
        {new Date(instance.dueDate).toLocaleDateString("es-ES")}
      </p>

      <SuperviseDetail instanceId={instance.id} rows={rows} />
    </div>
  );
}
