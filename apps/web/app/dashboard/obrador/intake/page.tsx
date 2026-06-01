import Link from 'next/link';
import { PlusIcon, ArchiveBoxIcon, TruckIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import DeleteObradorIntake from '@/app/ui/obrador/delete-intake';
import ObradorTabs from '@/app/ui/obrador/tabs';

function fmtDate(d: Date | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function ObradorIntakePage() {
  const session = await auth();
  const ownerId = session?.user?.id ?? '__none__';

  const intakes = await prisma.obradorRawMaterialEntry.findMany({
    where: { ownerId },
    orderBy: { receptionDate: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ObradorTabs />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ArchiveBoxIcon className="w-8 h-8 text-emerald-600" />
            Entradas de Materia Prima
          </h1>
          <p className="text-slate-600 mt-1">
            Registro de recepción y control de calidad de insumos.
          </p>
        </div>
        <Link
          href="/dashboard/obrador/intake/create"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Registrar Entrada
        </Link>
      </div>

      {intakes.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <ArchiveBoxIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            Aún no hay entradas registradas. Crea la primera con “Registrar Entrada”.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Proveedor / Producto</th>
                  <th className="px-6 py-4">Lote Prov.</th>
                  <th className="px-6 py-4">Caducidad</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4">Temp.</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {intakes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(item.receptionDate)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{item.productName}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <TruckIcon className="w-3 h-3" />
                          {item.supplierName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.supplierBatch ? (
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                          {item.supplierBatch}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-rose-600">
                      {fmtDate(item.expiryDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {item.quantityReceived} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.receptionTemp != null ? `${item.receptionTemp} ºC` : 'Ambiente'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                          item.isApto ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.isApto ? 'Apto' : 'No apto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DeleteObradorIntake id={item.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
