import { ArchiveBoxIcon } from "@heroicons/react/24/outline";
import StatCard from "@/app/ui/primitives/stat-card";

export default function StoragePage() {
  return (
    <div className="h-full grid grid-cols-12 gap-6">
      {/* Árbol de ubicaciones */}
      <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-gray-900">Ubicaciones</h2>
          <button className="text-xs text-[var(--accent-soft-contrast)] hover:underline font-medium">
            + Nueva zona
          </button>
        </div>
        <LocationTreeMock />
      </div>

      {/* Detalle de la ubicación seleccionada */}
      <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ArchiveBoxIcon className="w-6 h-6" />
            Almacén
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total productos" value={0} tone="accent" />
            <StatCard label="Valor stock" value="0,00 €" tone="success" />
            <StatCard label="Sin ubicación" value={0} tone="warning" />
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900">Productos en esta ubicación</h3>
            <input
              type="text"
              placeholder="Buscar producto..."
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            Selecciona una ubicación para ver su contenido
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationTreeMock() {
  const zones = [
    { name: "Cocina", icon: "🍳", timbres: ["Timbre 1", "Timbre 2"] },
    { name: "Almacén Seco", icon: "📦", timbres: ["Estantería A", "Estantería B"] },
    { name: "Cámara Fría", icon: "❄️", timbres: ["General", "Lácteos"] },
    { name: "Congelación", icon: "🧊", timbres: ["Arcón 1"] },
  ];

  return (
    <ul className="space-y-4">
      {zones.map((z) => (
        <li key={z.name}>
          <div className="font-medium text-gray-800 flex items-center gap-2">
            <span>{z.icon}</span> {z.name}
          </div>
          <ul className="pl-6 mt-1 space-y-1 border-l-2 border-gray-100 ml-2">
            {z.timbres.map((t) => (
              <li
                key={t}
                className="text-sm text-gray-600 hover:text-[var(--accent-soft-contrast)] cursor-pointer py-1"
              >
                {t}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
