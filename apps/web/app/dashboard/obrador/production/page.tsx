'use client';

import { 
  BeakerIcon, 
  PlusIcon, 
  CalendarIcon, 
  UserIcon, 
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

const mockBatches = [
  {
    id: '1',
    code: 'L-20260507-PI-001',
    product: 'Carne picada de ternera',
    date: '2026-05-07 10:00',
    expiry: '2026-05-09',
    quantity: '25 kg',
    operator: 'Juan Pérez',
    status: 'Abierto',
  },
  {
    id: '2',
    code: 'L-20260507-CH-001',
    product: 'Chorizo fresco',
    date: '2026-05-07 11:30',
    expiry: '2026-05-12',
    quantity: '50 kg',
    operator: 'María García',
    status: 'Cerrado',
  },
];

export default function ObradorProductionPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BeakerIcon className="w-8 h-8 text-emerald-600" />
            Producción y Lotes
          </h1>
          <p className="text-slate-600 mt-1">
            Registro de producciones diarias y control de trazabilidad.
          </p>
        </div>
        <Link 
          href="/dashboard/obrador/production/create"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Iniciar Nueva Producción
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lotes hoy</p>
          <p className="text-2xl font-extrabold text-slate-900">4</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Producción Total</p>
          <p className="text-2xl font-extrabold text-emerald-700">125 kg</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 shadow-sm">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Mermas</p>
          <p className="text-2xl font-extrabold text-rose-700">2.5 kg</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operarios</p>
          <p className="text-2xl font-extrabold text-slate-900">3</p>
        </div>
      </div>

      {/* Table of Batches */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por lote o producto..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Código de Lote</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Fecha Producción</th>
                <th className="px-6 py-4">Caducidad</th>
                <th className="px-6 py-4">Cantidad</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-emerald-700">{batch.code}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{batch.product}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                      {batch.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-rose-600">{batch.expiry}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{batch.quantity}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      {batch.operator}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      batch.status === 'Abierto' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors" title="Ver trazabilidad">
                        <ClipboardDocumentListIcon className="w-5 h-5" />
                      </button>
                      <Link href={`/dashboard/obrador/labeling/preview?batchId=${batch.id}`} className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors" title="Imprimir etiqueta">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </Link>
                    </div>
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
