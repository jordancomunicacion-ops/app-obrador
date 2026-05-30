import TasksTabs from "@/app/ui/tasks/tabs";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Tareas</h1>
      <TasksTabs />
      <div className="flex-grow overflow-auto">{children}</div>
    </div>
  );
}
