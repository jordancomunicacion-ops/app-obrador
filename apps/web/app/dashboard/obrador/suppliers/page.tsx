'use client';

import { 
  PlusIcon, 
  TruckIcon, 
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

const mockSuppliers = [
  {
    id: '1',
    name: 'Cárnicas Pepe',
    nif: 'B12345678',
    contact: 'Pepe García',
    phone: '600000000',
    email: 'pepe@carnicas.com',
    type: 'Carne fresca',
    registry: '26.00001/M',
    status: 'Activo',
  },
  {
    id: '2',
    name: 'Panadería El Horno',
    nif: 'A87654321',
    contact: 'Ana Martínez',
    phone: '611000000',
    email: 'ana@elhorno.es',
    type: 'Panadería',
    registry: '20.00045/M',
    status: 'Activo',
  },
];

export default function ObradorSuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('');

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
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          <PlusIcon className="w-5 h-5" />
          Nuevo Proveedor
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, CIF o tipo..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-colors">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">
                  {supplier.type}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                  {supplier.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{supplier.name}</h3>
              <p className="text-xs text-slate-400 font-mono mb-4">{supplier.nif}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <IdentificationIcon className="w-4 h-4 text-slate-400" />
                  {supplier.contact}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <PhoneIcon className="w-4 h-4 text-slate-400" />
                  {supplier.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                  {supplier.email}
                </div>
              </div>
              
              <div className="border-t border-slate-50 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Reg: {supplier.registry}</span>
                <button className="text-emerald-600 text-sm font-bold hover:underline">Ver Ficha</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
