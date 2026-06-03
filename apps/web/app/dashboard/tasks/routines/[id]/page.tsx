import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ProductionRoutineForm from "@/app/ui/tasks/production-routine-form";
import { loadRoutineOptions } from "../new/page";

export default async function EditProductionRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const routine = await prisma.productionRoutine.findFirst({
    where: { id, businessId: orgId },
  });
  if (!routine) notFound();

  const { recipes, locations, users } = await loadRoutineOptions(orgId);

  const initial = {
    title: routine.title,
    description: routine.description ?? "",
    recipeId: routine.recipeId ?? "",
    action: routine.action ?? "",
    technique: routine.technique ?? "",
    targetQuantity: routine.targetQuantity != null ? String(routine.targetQuantity) : "",
    unit: routine.unit ?? "",
    frequency: routine.frequency,
    startDate: routine.startDate.toISOString().slice(0, 10),
    endDate: routine.endDate ? routine.endDate.toISOString().slice(0, 10) : "",
    excludeWeekdays: routine.excludeWeekdays,
    executionTime: routine.executionTime ?? "",
    defaultAssigneeUserId: routine.defaultAssigneeUserId ?? "",
    locationId: routine.locationId ?? "",
    isActive: routine.isActive,
  };

  return (
    <div>
      <Link
        href="/dashboard/tasks/routines"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a ciclos
      </Link>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Editar ciclo de producción</h1>
      <ProductionRoutineForm
        recipes={recipes}
        locations={locations}
        users={users}
        initial={initial}
        initialId={routine.id}
      />
    </div>
  );
}
