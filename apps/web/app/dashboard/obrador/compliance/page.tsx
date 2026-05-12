'use client';

import { 
  ShieldCheckIcon, 
  ThermometerIcon, 
  SparklesIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const logs = [
  {
    id: 'temp',
    name: 'Registro de Temperaturas',
    description: 'Control diario de cámaras y obrador.',
    icon: ThermometerIcon,
    color: 'text-blue-600 bg-blue-50',
    lastEntry: 'Hoy, 09:00',
    status: 'Correcto',
  },
  {
    id: 'cleaning',
    name: 'Registro de Limpieza',
    description: 'Checklist de tareas de limpieza y desinfección.',
    icon: SparklesIcon,
    color: 'text-teal-600 bg-teal-50',
    lastEntry: 'Ayer, 22:00',
    status: 'Pendiente hoy',
  },
  {
    id: 'pests',
    name: 'Control de Plagas',
    description: 'Seguimiento de trampas y visitas técnicas.',
    icon: ShieldCheckIcon,
    color: 'text-emerald-600 bg-emerald-50',
    lastEntry: '01/05/2026',
    status: 'OK',
  },
  {
    id: 'training',
    name: 'Formación de Manipuladores',
    description: 'Certificados y registros de formación.',
    icon: ClipboardDocumentCheckIcon,
    color: 'text-purple-600 bg-purple-50',
    lastEntry: '15/03/2026',
    status: 'Vigente',
  },
];

export default function CompliancePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <ShieldCheckIcon className="w-8 h-8 text-emerald-600" />
          Controles Sanitarios y Compliance
        </h1>
        <p className="text-slate-600 mt-1">Gestión de registros obligatorios y plan APPCC.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {logs.map((log) => (
          <div key={log.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${log.color}`}>
                <log.icon className="w-6 h-6" />
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                log.status === 'Correcto' || log.status === 'OK' || log.status === 'Vigente'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
              }`}>
                {log.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{log.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{log.description}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-400">Último registro: {log.lastEntry}</span>
              <button className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline">
                Registrar
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Incidents Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-rose-600" />
            Incidencias y Desviaciones
          </h2>
          <button className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors">
            Nueva Incidencia
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No hay incidencias abiertas actualmente.</p>
            <p className="text-sm text-slate-400 mt-1">¡Buen trabajo manteniendo la seguridad alimentaria!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
