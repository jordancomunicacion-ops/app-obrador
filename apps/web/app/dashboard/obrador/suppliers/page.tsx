import Link from 'next/link';
import {
  PlusIcon,
  TruckIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import DeleteObradorSupplier from '@/app/ui/obrador/delete-supplier';

export default async function ObradorSuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    where: { ...(await locationScope()) },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <TruckIcon className="w-8 h-8 text-emerald-600" />
            Gestión de Proveedores
          </h1>
          <p className="text-slate-600 mt-1">
            Control de proveedores homologados y sus registros sanitarios.
          </p>
        </div>
        <Link
          href="/dashboard/obrador/suppliers/create"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Proveedor
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <TruckIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            Aún no hay proveedores. Crea el primero con “Nuevo Proveedor”.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-colors"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">
                    {supplier.productType || 'General'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">
                    {supplier.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{supplier.name}</h3>
                {supplier.nif && (
                  <p className="text-xs text-slate-400 font-mono mb-4">{supplier.nif}</p>
                )}

                <div className="space-y-2 mb-6">
                  {supplier.contactPerson && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <IdentificationIcon className="w-4 h-4 text-slate-400" />
                      {supplier.contactPerson}
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <PhoneIcon className="w-4 h-4 text-slate-400" />
                      {supplier.phone}
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                      {supplier.email}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-50 pt-4 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {supplier.healthRegistry ? `Reg: ${supplier.healthRegistry}` : 'Sin registro'}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/obrador/suppliers/${supplier.id}/edit`}
                      className="text-emerald-600 text-sm font-bold hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteObradorSupplier id={supplier.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
