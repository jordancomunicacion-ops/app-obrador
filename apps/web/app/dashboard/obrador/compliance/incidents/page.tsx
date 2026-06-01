import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import IncidentForm from '@/app/ui/obrador/incident-form';
import { CloseIncident, DeleteIncident } from '@/app/ui/obrador/incident-actions';
import ComplianceTabs from '@/app/ui/obrador/compliance-tabs';

function fmt(d: Date) {
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function IncidentsPage() {
  const session = await auth();
  const ownerId = session?.user?.id ?? '__none__';

  const incidents = await prisma.obradorIncident.findMany({
    where: { ownerId },
    orderBy: [{ status: 'asc' }, { incidentDate: 'desc' }],
    take: 100,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ComplianceTabs />

      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-6">
        <ExclamationTriangleIcon className="w-8 h-8 text-rose-600" />
        Incidencias y Desviaciones
      </h1>

      <IncidentForm />

      {incidents.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500 font-medium">No hay incidencias registradas.</p>
          <p className="text-sm text-slate-400 mt-1">
            ¡Buen trabajo manteniendo la seguridad alimentaria!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`bg-white rounded-xl border p-4 ${
                inc.status === 'abierto' ? 'border-rose-200' : 'border-slate-200 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                      {inc.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        inc.status === 'abierto'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {inc.status}
                    </span>
                    <span className="text-xs text-slate-400">{fmt(inc.incidentDate)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{inc.description}</p>
                  {inc.correctiveAction && (
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-semibold">Acción:</span> {inc.correctiveAction}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">Por: {inc.operatorName}</p>
                </div>
                <div className="flex items-center gap-3 flex-none">
                  {inc.status === 'abierto' && <CloseIncident id={inc.id} />}
                  <DeleteIncident id={inc.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
