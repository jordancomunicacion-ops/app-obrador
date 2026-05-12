'use client';

import { 
  ClipboardDocumentCheckIcon, 
  ArrowUpTrayIcon,
  DocumentIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const mockDocs = [
  { id: '1', title: 'Registro Sanitario 2026', category: 'Registro', date: '2026-01-15', size: '1.2 MB' },
  { id: '2', title: 'Plan APPCC - Obrador', category: 'APPCC', date: '2026-02-10', size: '4.5 MB' },
  { id: '3', title: 'Certificado Plagas Q1', category: 'Plagas', date: '2026-04-01', size: '0.8 MB' },
];

export default function ObradorDocumentsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-emerald-600" />
            Documentación Sanitaria
          </h1>
          <p className="text-slate-600 mt-1">Gestión centralizada de expedientes, certificados y planes.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
          <ArrowUpTrayIcon className="w-5 h-5" />
          Subir Documento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por título o categoría..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {mockDocs.map((doc) => (
            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DocumentIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{doc.title}</h4>
                  <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold uppercase">{doc.category}</span>
                    <span>Subido el {doc.date}</span>
                    <span>{doc.size}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <DocumentIcon className="w-10 h-10 text-slate-300 mb-2" />
          <h5 className="font-bold text-slate-400">Certificados de Proveedores</h5>
          <button className="mt-2 text-emerald-600 text-xs font-bold uppercase tracking-widest">Gestionar</button>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <DocumentIcon className="w-10 h-10 text-slate-300 mb-2" />
          <h5 className="font-bold text-slate-400">Fichas Técnicas</h5>
          <button className="mt-2 text-emerald-600 text-xs font-bold uppercase tracking-widest">Gestionar</button>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <DocumentIcon className="w-10 h-10 text-slate-300 mb-2" />
          <h5 className="font-bold text-slate-400">Inspecciones Sanitarias</h5>
          <button className="mt-2 text-emerald-600 text-xs font-bold uppercase tracking-widest">Gestionar</button>
        </div>
      </div>
    </div>
  );
}
