import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import TemperatureForm from '@/app/ui/obrador/temperature-form';
import DeleteTemperature from '@/app/ui/obrador/delete-temperature';
import ThermometerIcon from '@/app/ui/obrador/thermometer-icon';
import ComplianceTabs from '@/app/ui/obrador/compliance-tabs';

function fmt(d: Date) {
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function TemperaturesPage() {
  const session = await auth();
  const ownerId = session?.user?.id ?? '__none__';

  const logs = await prisma.obradorTemperatureLog.findMany({
    where: { ownerId },
    orderBy: { logDate: 'desc' },
    take: 100,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ComplianceTabs />

      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-6">
        <ThermometerIcon className="w-8 h-8 text-blue-600" />
        Registro de Temperaturas
      </h1>

      <TemperatureForm />

      {logs.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500">Aún no hay registros de temperatura.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Temp.</th>
                <th className="px-4 py-3">Operario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-500">{fmt(log.logDate)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{log.equipmentName}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{log.temperature} ºC</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.operatorName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                        log.hasIncidence
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {log.hasIncidence ? 'Desviación' : 'Correcto'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteTemperature id={log.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
