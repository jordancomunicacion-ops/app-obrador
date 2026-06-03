import TasksTabs from "@/app/ui/tasks/tabs";
import { requirePermission } from "@/app/lib/auth/business";

export default async function TasksLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("canViewTasks");
  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Tareas</h1>
      <TasksTabs />
      <div className="flex-grow overflow-auto">{children}</div>
    </div>
  );
}
