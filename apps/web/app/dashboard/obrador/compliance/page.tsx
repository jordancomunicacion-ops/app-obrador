import Link from 'next/link';
import {
  ShieldCheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import ThermometerIcon from '@/app/ui/obrador/thermometer-icon';
import ComplianceTabs from '@/app/ui/obrador/compliance-tabs';

function fmtAgo(d: Date | null | undefined) {
  if (!d) return 'Sin registros';
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function CompliancePage() {
  const session = await auth();
  const ownerId = session?.user?.id ?? '__none__';

  const [lastTemp, openIncidents, incidents, lastCleaning] = await Promise.all([
    prisma.obradorTemperatureLog.findFirst({
      where: { ownerId },
      orderBy: { logDate: 'desc' },
    }),
    prisma.obradorIncident.count({ where: { ownerId, status: 'abierto' } }),
    prisma.obradorIncident.findMany({
      where: { ownerId, status: 'abierto' },
      orderBy: { incidentDate: 'desc' },
      take: 5,
    }),
    prisma.obradorCleaningLog.findFirst({ orderBy: { logDate: 'desc' } }),
  ]);

  const cards = [
    {
      href: '/dashboard/obrador/compliance/temperatures',
      name: 'Registro de Temperaturas',
      description: 'Control diario de cámaras y obrador.',
      icon: <ThermometerIcon className="w-6 h-6" />,
      color: 'text-blue-600 bg-blue-50',
      lastEntry: fmtAgo(lastTemp?.logDate),
      ready: true,
    },
    {
      href: '/dashboard/obrador/compliance/incidents',
      name: 'Incidencias y Desviaciones',
      description: 'Registro y seguimiento de no conformidades.',
      icon: <ExclamationTriangleIcon className="w-6 h-6" />,
      color: 'text-rose-600 bg-rose-50',
      lastEntry: openIncidents > 0 ? `${openIncidents} abierta(s)` : 'Sin incidencias abiertas',
      ready: true,
    },
    {
      href: '/dashboard/obrador/compliance/cleaning',
      name: 'Registro de Limpieza',
      description: 'Plan de tareas de limpieza y desinfección.',
      icon: <SparklesIcon className="w-6 h-6" />,
      color: 'text-teal-600 bg-teal-50',
      lastEntry: fmtAgo(lastCleaning?.logDate),
      ready: true,
    },
    {
      href: '/dashboard/obrador/documents',
      name: 'Formación de Manipuladores',
      description: 'Certificados y registros de formación (en Documentación).',
      icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />,
      color: 'text-purple-600 bg-purple-50',
      lastEntry: 'Ver documentos',
      ready: true,
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ComplianceTabs />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <ShieldCheckIcon className="w-8 h-8 text-emerald-600" />
          Controles Sanitarios y Compliance
        </h1>
        <p className="text-slate-600 mt-1">Gestión de registros obligatorios y plan APPCC.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const inner = (
            <div
              className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full ${
                card.ready ? 'hover:shadow-md transition-all' : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.color}`}>{card.icon}</div>
                {card.ready && <ChevronRightIcon className="w-5 h-5 text-slate-300" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{card.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{card.description}</p>
              <div className="mt-4 pt-4 border-t border-slate-50">
                <span className="text-xs text-slate-400">Último: {card.lastEntry}</span>
              </div>
            </div>
          );
          return card.href ? (
            <Link key={card.name} href={card.href}>
              {inner}
            </Link>
          ) : (
            <div key={card.name}>{inner}</div>
          );
        })}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-rose-600" />
            Incidencias Abiertas
          </h2>
          <Link
            href="/dashboard/obrador/compliance/incidents"
            className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors"
          >
            Gestionar incidencias
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {incidents.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No hay incidencias abiertas actualmente.</p>
              <p className="text-sm text-slate-400 mt-1">
                ¡Buen trabajo manteniendo la seguridad alimentaria!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase mr-2">
                      {inc.type}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{inc.description}</span>
                  </div>
                  <span className="text-xs text-slate-400">{fmtAgo(inc.incidentDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
