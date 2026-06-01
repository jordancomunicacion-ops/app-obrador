import { BuildingStorefrontIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import ObradorTabs from "@/app/ui/obrador/tabs";
import PageHeader from "@/app/ui/primitives/page-header";
import StatCard from "@/app/ui/primitives/stat-card";

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
        title="Obrador"
        description="Registro sanitario, trazabilidad y etiquetado de productos elaborados."
      />

      <ObradorTabs />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-6">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
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
