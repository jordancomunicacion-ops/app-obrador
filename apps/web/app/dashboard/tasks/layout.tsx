import { redirect } from "next/navigation";
import TasksTabs from "@/app/ui/tasks/tabs";
import { requirePermission } from "@/app/lib/auth/business";
import { getViewerContext } from "@/app/lib/auth/viewer";

export default async function TasksLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewTasks");
  // El trabajador (ni dirección ni encargado) no gestiona tareas: su vista es
  // "Hoy", que muestra sólo SUS tareas asignadas del día.
  const viewer = await getViewerContext();
  if (!viewer.isManager && !viewer.isSupervisor) redirect("/dashboard/today");
  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Tareas</h1>
      <TasksTabs />
      <div className="flex-grow overflow-auto">{children}</div>
    </div>
  );
}
