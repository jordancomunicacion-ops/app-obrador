'use client';

import { useState } from 'react';
import { 
  TagIcon, 
  PrinterIcon, 
  ArrowLeftIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function LabelPreviewPage() {
  const [template, setTemplate] = useState('100x70');

  // Example data for the label
  const labelData = {
    name: 'Carne Picada de Ternera',
    denomination: 'Preparado de carne picada de vacuno',
    ingredients: 'Carne de vacuno (95%), agua, sal, antioxidantes (E-301, E-331), conservador (SULFITOS), especias.',
    allergens: ['SULFITOS'],
    netWeight: '500g',
    expiry: '09/05/2026',
    batch: 'L-20260507-CARN-001',
    conservation: 'Conservar entre 0ºC y 4ºC. Una vez abierto consumir en 24h.',
    operator: 'SOTOdelPRIOR Gourmet - Calle Mayor 1, Madrid',
    origin: 'España',
    modeOfUse: 'Cocinar completamente antes de su consumo.',
  };

  const renderIngredients = (text: string, allergens: string[]) => {
    let parts = [text];
    allergens.forEach(allergen => {
      const regex = new RegExp(`(${allergen})`, 'gi');
      const newParts: string[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const splitPart = part.split(regex);
          newParts.push(...splitPart);
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts.map((part, i) => 
      allergens.some(a => a.toLowerCase() === part.toLowerCase()) 
      ? <strong key={i} className="font-extrabold uppercase">{part}</strong> 
      : part
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/obrador/production" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <TagIcon className="w-8 h-8 text-emerald-600" />
              Vista Previa de Etiqueta
            </h1>
            <p className="text-slate-600 mt-1">Configura el formato y envía a impresión.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AdjustmentsIcon />
              Configuración de Impresión
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plantilla de Tamaño</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  <option value="100x70">100 x 70 mm (Grande)</option>
                  <option value="100x50">100 x 50 mm (Estándar)</option>
                  <option value="80x50">80 x 50 mm (Mediana)</option>
                  <option value="60x40">60 x 40 mm (Pequeña)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de Etiquetas</label>
                <input type="number" defaultValue={1} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>

              <div className="pt-4 space-y-3">
                <button className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all">
                  <PrinterIcon className="w-5 h-5" />
                  Imprimir (Navegador)
                </button>
                <button className="w-full py-3 border border-emerald-600 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 flex items-center justify-center gap-2 transition-all">
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Exportar PDF
                </button>
                <button className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 flex items-center justify-center gap-2 transition-all">
                  <div className="text-[10px] bg-white text-slate-800 px-1 rounded font-black">ZPL</div>
                  Enviar a Zebra (Industrial)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-2 flex justify-center items-start bg-slate-100 p-8 rounded-3xl border border-slate-200 min-h-[600px]">
          {/* Mock Label */}
          <div className="bg-white shadow-2xl overflow-hidden border border-slate-300 flex flex-col" style={{ 
            width: template === '100x70' ? '400px' : '400px', 
            height: template === '100x70' ? '280px' : '200px',
            padding: '15px'
          }}>
            <div className="flex justify-between items-start border-b border-black pb-1 mb-2">
              <h2 className="text-xl font-black uppercase leading-tight">{labelData.name}</h2>
              <div className="text-[8px] border border-black p-0.5 font-bold">ES-10.00000/M</div>
            </div>

            <div className="text-[9px] leading-tight mb-2">
              <p className="font-bold italic mb-1">{labelData.denomination}</p>
              <p className="text-justify">
                <strong>Ingredientes:</strong> {renderIngredients(labelData.ingredients, labelData.allergens)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[9px] mb-2 border-y border-slate-200 py-1">
              <div>
                <p><strong>Cadu/Cons. Pref:</strong> <span className="text-sm font-black">{labelData.expiry}</span></p>
                <p><strong>Lote:</strong> <span className="font-mono font-bold text-[10px]">{labelData.batch}</span></p>
              </div>
              <div className="text-right">
                <p><strong>Peso Neto:</strong> <span className="text-sm font-black">{labelData.netWeight}</span></p>
                <p className="text-[7px] italic mt-1">Envasado en atmósfera protectora</p>
              </div>
            </div>

            <div className="text-[7px] leading-snug space-y-0.5">
              <p><strong>Conservación:</strong> {labelData.conservation}</p>
              <p><strong>Origen:</strong> {labelData.origin} | <strong>Uso:</strong> {labelData.modeOfUse}</p>
              <p className="font-bold border-t border-slate-100 pt-1 mt-1 uppercase text-slate-500">
                {labelData.operator}
              </p>
            </div>

            <div className="mt-auto flex justify-between items-end">
               <div className="w-12 h-12 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400 border border-slate-200">
                 QR CODE
               </div>
               <div className="text-[6px] text-slate-300">v1.0.obrador</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjustmentsIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}
