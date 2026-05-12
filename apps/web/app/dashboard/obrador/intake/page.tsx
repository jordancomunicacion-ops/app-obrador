'use client';

import { 
  PlusIcon, 
  ArchiveBoxIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

const mockIntakes = [
  {
    id: '1',
    supplier: 'Cárnicas Pepe',
    product: 'Solomillo Ternera',
    batch: 'L-4455',
    date: '2026-05-08',
    expiry: '2026-05-15',
    quantity: '15 kg',
    temp: '2.5 ºC',
    status: 'Apto',
  },
  {
    id: '2',
    supplier: 'Panadería El Horno',
    product: 'Harina Trigo',
    batch: 'H-9988',
    date: '2026-05-07',
    expiry: '2026-11-07',
    quantity: '100 kg',
    temp: 'Ambiente',
    status: 'Apto',
  },
];

export default function ObradorIntakePage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          <PlusIcon className="w-5 h-5" />
          Registrar Entrada
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por proveedor, producto o lote..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
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
                <th className="px-6 py-4 text-right">Doc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockIntakes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{item.product}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <TruckIcon className="w-3 h-3" />
                        {item.supplier}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{item.batch}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-rose-600">{item.expiry}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.temp}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-emerald-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
