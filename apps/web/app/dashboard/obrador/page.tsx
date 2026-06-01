import {
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  BeakerIcon,
  TagIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import PageHeader from "@/app/ui/primitives/page-header";
import StatCard from "@/app/ui/primitives/stat-card";
import Card from "@/app/ui/primitives/card";

const modules = [
  {
    name: "Entradas de Materia Prima",
    description: "Registro de recepción y control de insumos",
    href: "/dashboard/obrador/intake",
    icon: ArchiveBoxIcon,
    color: "bg-orange-100 text-orange-700",
  },
  {
    name: "Producción y Lotes",
    description: "Creación de lotes, trazabilidad y control de mermas",
    href: "/dashboard/obrador/production",
    icon: BeakerIcon,
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Etiquetado Alimentario",
    description: "Etiquetas de venta (sección Etiquetas)",
    href: "/dashboard/today/labels?destination=sale",
    icon: TagIcon,
    color: "bg-rose-100 text-rose-700",
  },
];

export default async function ObradorPage() {
  const session = await auth();
  const ownerId = session?.user?.id ?? "__none__";

  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activeBatches, expiringBatches, tempIssuesToday, openIncidents] = await Promise.all([
    prisma.obradorProductionBatch.count({ where: { ownerId, status: "abierto" } }),
    prisma.obradorProductionBatch.count({
      where: { ownerId, status: { not: "retirado" }, expiryDate: { gte: now, lte: in3days } },
    }),
    prisma.obradorTemperatureLog.count({
      where: { ownerId, hasIncidence: true, logDate: { gte: todayStart } },
    }),
    prisma.obradorIncident.count({ where: { ownerId, status: "abierto" } }),
  ]);

  const stats = [
    { label: "Lotes activos", value: activeBatches, tone: "accent" as const },
    {
      label: "Alertas de caducidad",
      value: expiringBatches,
      tone: expiringBatches > 0 ? ("danger" as const) : ("success" as const),
    },
    {
      label: "Desviaciones temp. hoy",
      value: tempIssuesToday,
      tone: tempIssuesToday > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      label: "Incidencias abiertas",
      value: openIncidents,
      tone: openIncidents > 0 ? ("danger" as const) : ("success" as const),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        icon={<BuildingStorefrontIcon className="w-6 h-6" />}
        title="Módulo de Obrador"
        description="Registro sanitario, trazabilidad y etiquetado de productos elaborados."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m) => (
          <Card key={m.name} href={m.href} className="p-6">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${m.color}`}
            >
              <m.icon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[var(--accent-soft-contrast)] transition-colors">
              {m.name}
            </h3>
            <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{m.description}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
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
