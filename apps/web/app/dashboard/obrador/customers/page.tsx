'use client';

import { 
  UserGroupIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  MapPinIcon,
  EnvelopeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const mockCustomers = [
  {
    id: '1',
    name: 'Restaurante El Jardín',
    type: 'Minorista',
    address: 'Av. Libertad 10, Madrid',
    contact: 'Laura San José',
    email: 'pedidos@eljardin.com',
    status: 'Activo',
  },
  {
    id: '2',
    name: 'Tienda Gourmet Centro',
    type: 'Minorista',
    address: 'Plaza Mayor 5, Madrid',
    contact: 'Carlos Ruiz',
    email: 'ventas@gourmetcentro.com',
    status: 'Activo',
  },
  {
    id: '3',
    name: 'Consumidor Final (Directo)',
    type: 'Venta Directa',
    address: 'N/A',
    contact: 'N/A',
    email: 'N/A',
    status: 'Activo',
  },
];

export default function ObradorCustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');

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
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          <PlusIcon className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o tipo..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-colors">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                  {customer.type}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                  {customer.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{customer.name}</h3>
              
              <div className="space-y-2 mt-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPinIcon className="w-4 h-4 text-slate-400" />
                  {customer.address}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                  {customer.email}
                </div>
              </div>

              {customer.type === 'Minorista' && (
                <div className="bg-amber-50 p-2 rounded text-[10px] text-amber-800 flex gap-2 items-start">
                  <TagIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Sujeto a normativa de suministro marginal y restringido.</span>
                </div>
              )}
              
              <div className="border-t border-slate-50 pt-4 mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">ID: {customer.id}</span>
                <button className="text-emerald-600 text-sm font-bold hover:underline">Ver Ventas</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
