'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TagIcon,
  PrinterIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export type LabelData = {
  name: string;
  denomination: string;
  ingredients: string;
  allergens: string[];
  netWeight: string;
  expiry: string;
  batch: string;
  conservation: string;
  operator: string;
  registry: string;
  origin: string;
  modeOfUse: string;
};

function renderIngredients(text: string, allergens: string[]) {
  if (!text) return '—';
  let parts: string[] = [text];
  allergens.forEach((allergen) => {
    if (!allergen) return;
    const regex = new RegExp(`(${allergen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const next: string[] = [];
    parts.forEach((part) => next.push(...part.split(regex)));
    parts = next;
  });
  return parts.map((part, i) =>
    allergens.some((a) => a && a.toLowerCase() === part.toLowerCase()) ? (
      <strong key={i} className="font-extrabold uppercase">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

export default function LabelPreview({ data }: { data: LabelData }) {
  const [template, setTemplate] = useState('100x70');

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/obrador/production"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
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
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Configuración de Impresión</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Plantilla de Tamaño
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  <option value="100x70">100 x 70 mm (Grande)</option>
                  <option value="100x50">100 x 50 mm (Estándar)</option>
                </select>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                >
                  <PrinterIcon className="w-5 h-5" />
                  Imprimir (Navegador)
                </button>
                <button
                  disabled
                  title="Próximamente"
                  className="w-full py-3 border border-slate-300 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Exportar PDF / ZPL (próximamente)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-center items-start bg-slate-100 p-8 rounded-3xl border border-slate-200 min-h-[600px] print:bg-white print:border-0 print:p-0 print:block">
          <div
            className="bg-white shadow-2xl overflow-hidden border border-slate-300 flex flex-col print:shadow-none print:border-black"
            style={{
              width: '400px',
              height: template === '100x70' ? '280px' : '200px',
              padding: '15px',
            }}
          >
            <div className="flex justify-between items-start border-b border-black pb-1 mb-2">
              <h2 className="text-xl font-black uppercase leading-tight">{data.name}</h2>
              {data.registry && (
                <div className="text-[8px] border border-black p-0.5 font-bold whitespace-nowrap">
                  {data.registry}
                </div>
              )}
            </div>

            <div className="text-[9px] leading-tight mb-2">
              {data.denomination && <p className="font-bold italic mb-1">{data.denomination}</p>}
              <p className="text-justify">
                <strong>Ingredientes:</strong>{' '}
                {renderIngredients(data.ingredients, data.allergens)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[9px] mb-2 border-y border-slate-200 py-1">
              <div>
                <p>
                  <strong>Cadu/Cons. Pref:</strong>{' '}
                  <span className="text-sm font-black">{data.expiry}</span>
                </p>
                <p>
                  <strong>Lote:</strong>{' '}
                  <span className="font-mono font-bold text-[10px]">{data.batch}</span>
                </p>
              </div>
              <div className="text-right">
                <p>
                  <strong>Peso Neto:</strong>{' '}
                  <span className="text-sm font-black">{data.netWeight}</span>
                </p>
              </div>
            </div>

            <div className="text-[7px] leading-snug space-y-0.5">
              {data.conservation && (
                <p>
                  <strong>Conservación:</strong> {data.conservation}
                </p>
              )}
              <p>
                <strong>Origen:</strong> {data.origin} | <strong>Uso:</strong> {data.modeOfUse}
              </p>
              <p className="font-bold border-t border-slate-100 pt-1 mt-1 uppercase text-slate-500">
                {data.operator}
              </p>
            </div>

            <div className="mt-auto flex justify-between items-end">
              <div className="text-[6px] text-slate-300">v1.0.obrador</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
