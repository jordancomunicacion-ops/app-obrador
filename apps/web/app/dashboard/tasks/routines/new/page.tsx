import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ProductionRoutineForm from "@/app/ui/tasks/production-routine-form";

export async function loadRoutineOptions(orgId: string) {
  const [recipes, locations, users] = await Promise.all([
    prisma.recipe.findMany({
      where: { ownerId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { ownerId: orgId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { OR: [{ id: orgId }, { adminId: orgId }] },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { recipes, locations, users };
}

export default async function NewProductionRoutinePage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const { recipes, locations, users } = await loadRoutineOptions(orgId);

  return (
    <div>
      <Link
        href="/dashboard/tasks/routines"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a ciclos
      </Link>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Nuevo ciclo de producción</h1>
      <ProductionRoutineForm recipes={recipes} locations={locations} users={users} />
    </div>
  );
}
