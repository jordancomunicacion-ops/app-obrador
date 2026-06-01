import { BuildingStorefrontIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import ObradorTabs from '@/app/ui/obrador/tabs';

export default async function ObradorPage() {
  const session = await auth();
  const ownerId = session?.user?.id ?? '__none__';

  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activeBatches, expiringBatches, tempIssuesToday, openIncidents] = await Promise.all([
    prisma.obradorProductionBatch.count({ where: { ownerId, status: 'abierto' } }),
    prisma.obradorProductionBatch.count({
      where: {
        ownerId,
        status: { not: 'retirado' },
        expiryDate: { gte: now, lte: in3days },
      },
    }),
    prisma.obradorTemperatureLog.count({
      where: { ownerId, hasIncidence: true, logDate: { gte: todayStart } },
    }),
    prisma.obradorIncident.count({ where: { ownerId, status: 'abierto' } }),
  ]);

  const stats = [
    { label: 'Lotes Activos', value: String(activeBatches), cls: 'text-slate-900' },
    { label: 'Alertas de Caducidad', value: String(expiringBatches), cls: 'text-rose-600' },
    {
      label: 'Desviaciones Temp. hoy',
      value: String(tempIssuesToday),
      cls: tempIssuesToday > 0 ? 'text-amber-600' : 'text-emerald-600',
    },
    {
      label: 'Incidencias Abiertas',
      value: String(openIncidents),
      cls: openIncidents > 0 ? 'text-rose-600' : 'text-emerald-600',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 mb-4">
        <BuildingStorefrontIcon className="w-9 h-9 text-emerald-600" />
        Obrador
      </h1>

      <ObradorTabs />

      <p className="mb-8 text-slate-600">
        Sistema integral de gestión de registro sanitario, trazabilidad y etiquetado.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-4">
        <ShieldCheckIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-amber-900">Aviso legal y sanitario</h4>
          <p className="text-sm text-amber-800 mt-1">
            Esta aplicación ayuda a organizar información sanitaria, trazabilidad y etiquetado
            alimentario. No sustituye el asesoramiento de un técnico de seguridad alimentaria ni la
            validación de la autoridad sanitaria competente.
          </p>
        </div>
      </div>
    </div>
  );
}
