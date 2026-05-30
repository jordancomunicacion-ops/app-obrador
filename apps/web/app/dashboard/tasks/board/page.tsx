import TaskBoard from "@/app/ui/tasks/board";
import { CreateTask, GenerateWeeklyProduction } from "@/app/ui/tasks/buttons";
import { Suspense } from "react";

export default function BoardPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-end gap-2 mb-4">
        <CreateTask />
        <GenerateWeeklyProduction />
      </div>
      <div className="flex-grow overflow-auto">
        <Suspense fallback={<div>Cargando tareas...</div>}>
          <TaskBoard />
        </Suspense>
      </div>
    </div>
  );
}
