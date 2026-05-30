import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ChecklistRunner from "@/app/ui/today/checklist-runner";
import { openInstance } from "@/app/lib/actions/checklist-instances";

export default async function ChecklistInstancePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) notFound();

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
      responses: true,
    },
  });
  if (!instance) notFound();

  // Marcar como IN_PROGRESS al abrir (la action verifica permisos)
  await openInstance(instanceId).catch(() => {
    // si el user no es ejecutor/supervisor, no abrimos
  });

  const alreadyDone =
    instance.status === "DONE" ||
    instance.status === "CLOSED_AUTO" ||
    instance.status === "INCIDENT";

  return (
    <div>
      <Link
        href="/dashboard/today"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>
      <p className="text-xs text-gray-500 mb-1">{instance.schedule.location.name}</p>

      <ChecklistRunner
        instanceId={instance.id}
        templateName={instance.schedule.template.name}
        fields={instance.schedule.template.fields.map((f) => ({
          id: f.id,
          order: f.order,
          type: f.type,
          name: f.name,
          description: f.description,
          exampleImageUrl: f.exampleImageUrl,
          photoRequirement: f.photoRequirement,
        }))}
        initialResponses={instance.responses.map((r) => ({
          fieldId: r.fieldId,
          valueText: r.valueText,
          valueBool: r.valueBool,
          valueRating: r.valueRating,
          photoUrl: r.photoUrl,
          isIncident: r.isIncident,
          incidentNote: r.incidentNote,
        }))}
        alreadyDone={alreadyDone}
      />
    </div>
  );
}
