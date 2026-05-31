import Link from 'next/link';
import {
  UserGroupIcon,
  PlusIcon,
  MapPinIcon,
  EnvelopeIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import DeleteObradorCustomer from '@/app/ui/obrador/delete-customer';

export default async function ObradorCustomersPage() {
  const customers = await prisma.customer.findMany({
    where: { ...(await locationScope()) },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <UserGroupIcon className="w-8 h-8 text-emerald-600" />
            Clientes y Destinos de Venta
          </h1>
          <p className="text-slate-600 mt-1">
            Gestión de puntos de venta y establecimientos minoristas.
          </p>
        </div>
        <Link
          href="/dashboard/obrador/customers/create"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Cliente
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <UserGroupIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            Aún no hay clientes. Crea el primero con “Nuevo Cliente”.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-colors"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                    {customer.customerType || 'Sin tipo'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{customer.name}</h3>
                {customer.contactPerson && (
                  <p className="text-sm text-slate-500">{customer.contactPerson}</p>
                )}

                <div className="space-y-2 mt-4 mb-6">
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPinIcon className="w-4 h-4 text-slate-400" />
                      {customer.address}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                      {customer.email}
                    </div>
                  )}
                </div>

                {customer.customerType === 'Minorista' && (
                  <div className="bg-amber-50 p-2 rounded text-[10px] text-amber-800 flex gap-2 items-start">
                    <TagIcon className="w-4 h-4 flex-shrink-0" />
                    <span>Sujeto a normativa de suministro marginal y restringido.</span>
                  </div>
                )}

                <div className="border-t border-slate-50 pt-4 mt-4 flex items-center justify-between">
                  <Link
                    href={`/dashboard/obrador/customers/${customer.id}/edit`}
                    className="text-emerald-600 text-sm font-bold hover:underline"
                  >
                    Editar
                  </Link>
                  <DeleteObradorCustomer id={customer.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
