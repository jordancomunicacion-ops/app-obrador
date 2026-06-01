import { SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import CleaningTaskForm from '@/app/ui/obrador/cleaning-task-form';
import { deleteCleaningTask, logCleaning } from '@/app/lib/actions/obrador-cleaning';
import ComplianceTabs from '@/app/ui/obrador/compliance-tabs';

function fmt(d: Date) {
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function CleaningPage() {
  const tasks = await prisma.obradorCleaningTask.findMany({
    orderBy: [{ area: 'asc' }, { task: 'asc' }],
    include: { logs: { orderBy: { logDate: 'desc' }, take: 1 } },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ComplianceTabs />

      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-6">
        <SparklesIcon className="w-8 h-8 text-teal-600" />
        Registro de Limpieza
      </h1>

      <CleaningTaskForm />

      {tasks.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500">
            Aún no hay tareas de limpieza definidas. Añade la primera arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const last = t.logs[0];
            return (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded uppercase">
                        {t.area}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">
                        {t.frequency}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900">{t.task}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {last
                        ? `Último: ${last.status} · ${last.operatorName} · ${fmt(last.logDate)}`
                        : 'Sin registros todavía'}
                    </p>
                  </div>
                  <form action={deleteCleaningTask.bind(null, t.id)}>
                    <button
                      type="submit"
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Borrar tarea"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </form>
                </div>

                <form
                  action={logCleaning}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center border-t border-slate-100 pt-3"
                >
                  <input type="hidden" name="taskId" value={t.id} />
                  <select
                    name="status"
                    defaultValue="Realizado"
                    className="px-3 py-1.5 border border-slate-200 rounded text-sm"
                  >
                    <option value="Realizado">Realizado</option>
                    <option value="No realizado">No realizado</option>
                  </select>
                  <input
                    name="operatorName"
                    type="text"
                    placeholder="Operario"
                    className="px-3 py-1.5 border border-slate-200 rounded text-sm"
                  />
                  <input
                    name="observations"
                    type="text"
                    placeholder="Observaciones (opcional)"
                    className="px-3 py-1.5 border border-slate-200 rounded text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 text-white text-sm font-bold rounded hover:bg-teal-700 transition-all"
                  >
                    Registrar
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
