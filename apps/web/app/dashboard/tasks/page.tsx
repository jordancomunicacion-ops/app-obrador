import TaskBoard from '@/app/ui/tasks/board';
import { CreateTask, GenerateWeeklyProduction } from '@/app/ui/tasks/buttons';
import { Suspense } from 'react';

export default function Page() {
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-2xl">Tablero de Tareas</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
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
