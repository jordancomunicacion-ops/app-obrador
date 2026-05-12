'use client';

import { useState, useEffect } from 'react';
import { 
  BeakerIcon, 
  ArchiveBoxIcon, 
  CalendarIcon, 
  ClockIcon,
  TagIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format, addDays } from 'date-fns';

export default function CreateObradorProductionPage() {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productionDate, setProductionDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [quantity, setQuantity] = useState(0);
  const [expiryDate, setExpiryDate] = useState('');
  
  // Logic to auto-calculate batch code: L-YYYYMMDD-PROD-NNN
  const [batchCode, setBatchCode] = useState('');

  useEffect(() => {
    const datePart = format(new Date(productionDate), 'yyyyMMdd');
    const prodPart = selectedProductId ? selectedProductId.slice(0, 4).toUpperCase() : 'PROD';
    setBatchCode(`L-${datePart}-${prodPart}-001`);
  }, [productionDate, selectedProductId]);

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    // In a real app, fetch shelf life from DB
    const shelfLife = 3; 
    const calculatedExpiry = format(addDays(new Date(productionDate), shelfLife), 'yyyy-MM-dd');
    setExpiryDate(calculatedExpiry);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/obrador/production" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <BeakerIcon className="w-8 h-8 text-emerald-600" />
              Nueva Producción
            </h1>
            <p className="text-slate-600 mt-1">Registra una nueva elaboración y asocia materias primas.</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Step 1: Batch Info */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-emerald-600" />
            Identificación del Lote
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Producto a Elaborar</label>
              <select 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
              >
                <option value="">Selecciona un producto...</option>
                <option value="CARN">Carne picada de ternera</option>
                <option value="CHOR">Chorizo fresco</option>
                <option value="PANC">Pan casero de hamburguesa</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código de Lote</label>
              <input 
                type="text" 
                value={batchCode} 
                readOnly 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y Hora de Producción</label>
              <input 
                type="datetime-local" 
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad Producida</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej. 25.5"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-medium">kg / uds</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Caducidad (Calculada)</label>
              <input 
                type="date" 
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-rose-600"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Traceability (Materials Used) */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ArchiveBoxIcon className="w-5 h-5 text-emerald-600" />
              Materias Primas Utilizadas (Trazabilidad)
            </h3>
            <button type="button" className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline">
              <PlusIcon className="w-4 h-4" />
              Añadir Insumo
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-3 pb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-5">Materia Prima / Proveedor</div>
              <div className="col-span-3">Lote Proveedor</div>
              <div className="col-span-2 text-right">Cantidad</div>
              <div className="col-span-2"></div>
            </div>

            {/* Example row */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5">
                <select className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm">
                  <option>Ternera - Carnicas Pepe (L-4455)</option>
                  <option>Sal - Provedor X (L-9988)</option>
                </select>
              </div>
              <div className="col-span-3">
                <input type="text" readOnly value="L-445522" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm font-mono" />
              </div>
              <div className="col-span-2">
                <input type="number" step="0.1" className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm text-right" placeholder="10.0" />
              </div>
              <div className="col-span-2 flex justify-end">
                <button type="button" className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Observations & Responsibility */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Operario Responsable</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input type="text" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" placeholder="Nombre del operario" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mermas (Opcional)</label>
              <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Kg perdidos" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Cualquier incidencia o detalle de la producción..." />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Link href="/dashboard/obrador/production" className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all">
            Cancelar
          </Link>
          <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
            <CheckIcon className="w-5 h-5" />
            Cerrar Lote y Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
