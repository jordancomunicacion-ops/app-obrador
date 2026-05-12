import { 
  BuildingStorefrontIcon, 
  UserGroupIcon, 
  ArchiveBoxIcon, 
  BeakerIcon, 
  ClipboardDocumentCheckIcon, 
  TruckIcon, 
  TagIcon, 
  DocumentChartBarIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const modules = [
  {
    name: 'Datos del Establecimiento',
    description: 'Configuración de registro sanitario y datos fiscales',
    href: '/dashboard/obrador/config',
    icon: BuildingStorefrontIcon,
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Productos y Recetas',
    description: 'Catálogo de productos envasados y sus composiciones',
    href: '/dashboard/obrador/products',
    icon: ArchiveBoxIcon,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Proveedores',
    description: 'Gestión de proveedores homologados',
    href: '/dashboard/obrador/suppliers',
    icon: TruckIcon,
    color: 'bg-amber-100 text-amber-700',
  },
  {
    name: 'Entradas de Materia Prima',
    description: 'Registro de recepción y control de insumos',
    href: '/dashboard/obrador/intake',
    icon: ArchiveBoxIcon,
    color: 'bg-orange-100 text-orange-700',
  },
  {
    name: 'Producción y Lotes',
    description: 'Creación de lotes, trazabilidad y control de mermas',
    href: '/dashboard/obrador/production',
    icon: BeakerIcon,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    name: 'Trazabilidad y Ventas',
    description: 'Seguimiento de lotes y registro de destinos de venta',
    href: '/dashboard/obrador/traceability',
    icon: DocumentChartBarIcon,
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    name: 'Clientes y Puntos de Venta',
    description: 'Gestión de clientes minoristas y venta directa',
    href: '/dashboard/obrador/customers',
    icon: UserGroupIcon,
    color: 'bg-cyan-100 text-cyan-700',
  },
  {
    name: 'Etiquetado Alimentario',
    description: 'Generación de etiquetas, ZPL y plantillas',
    href: '/dashboard/obrador/labeling',
    icon: TagIcon,
    color: 'bg-rose-100 text-rose-700',
  },
  {
    name: 'Controles Sanitarios',
    description: 'Temperaturas, Limpieza y Plan APPCC',
    href: '/dashboard/obrador/compliance',
    icon: ShieldCheckIcon,
    color: 'bg-teal-100 text-teal-700',
  },
  {
    name: 'Incidencias',
    description: 'Registro de desviaciones y acciones correctoras',
    href: '/dashboard/obrador/incidents',
    icon: ExclamationTriangleIcon,
    color: 'bg-red-100 text-red-700',
  },
  {
    name: 'Documentación',
    description: 'Gestión documental y expedientes sanitarios',
    href: '/dashboard/obrador/documents',
    icon: ClipboardDocumentCheckIcon,
    color: 'bg-slate-100 text-slate-700',
  },
];

export default function ObradorPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <BuildingStorefrontIcon className="w-10 h-10 text-emerald-600" />
          Módulo de Obrador
        </h1>
        <p className="mt-2 text-slate-600">
          Sistema integral de gestión de registro sanitario, trazabilidad y etiquetado.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Lotes Activos</p>
          <p className="text-2xl font-bold text-slate-900">12</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Alertas de Caducidad</p>
          <p className="text-2xl font-bold text-rose-600">3</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Temp. Cámaras OK</p>
          <p className="text-2xl font-bold text-emerald-600">4/4</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Limpieza Hoy</p>
          <p className="text-2xl font-bold text-amber-600">80%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-emerald-300"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${module.color}`}>
              <module.icon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {module.name}
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {module.description}
            </p>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-emerald-600 font-bold">→</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Warnings / Important Info */}
      <div className="mt-12 bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-4">
        <ShieldCheckIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-amber-900">Aviso legal y sanitario</h4>
          <p className="text-sm text-amber-800 mt-1">
            Esta aplicación ayuda a organizar información sanitaria, trazabilidad y etiquetado alimentario. 
            No sustituye el asesoramiento de un técnico de seguridad alimentaria ni la validación de la autoridad sanitaria competente.
          </p>
        </div>
      </div>
    </div>
  );
}
