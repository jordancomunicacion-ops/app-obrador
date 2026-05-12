'use client';

import { 
  PlusIcon, 
  ArchiveBoxIcon, 
  TagIcon, 
  BeakerIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

// Mock data for initial preview
const mockProducts = [
  {
    id: '1',
    name: 'Carne picada de ternera',
    category: 'Carne fresca',
    lifeSpan: 2,
    status: 'Activo',
    allergens: [],
  },
  {
    id: '2',
    name: 'Pan casero de hamburguesa',
    category: 'Pan',
    lifeSpan: 3,
    status: 'Activo',
    allergens: ['Gluten'],
  },
  {
    id: '3',
    name: 'Chorizo fresco',
    category: 'Embutido',
    lifeSpan: 5,
    status: 'Activo',
    allergens: ['Sulfitos'],
  },
];

export default function ObradorProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ArchiveBoxIcon className="w-8 h-8 text-emerald-600" />
            Catálogo de Productos Pack
          </h1>
          <p className="text-slate-600 mt-1">
            Gestiona los productos destinados a envasado y venta.
          </p>
        </div>
        <Link 
          href="/dashboard/obrador/products/create"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Producto
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o categoría..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          Filtros
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-colors">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded uppercase tracking-wider">
                  {product.category}
                </span>
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <TagIcon className="w-4 h-4" />
                  ID: {product.id}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Vida útil:</span> {product.lifeSpan} días
                </div>
                <div className="flex flex-wrap gap-1">
                  {product.allergens.length > 0 ? (
                    product.allergens.map(a => (
                      <span key={a} className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded border border-rose-100">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sin alérgenos declarados</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
                <Link 
                  href={`/dashboard/obrador/products/${product.id}`}
                  className="flex-1 text-center py-2 bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Editar
                </Link>
                <Link 
                  href={`/dashboard/obrador/production/create?productId=${product.id}`}
                  className="flex-1 text-center py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                >
                  <BeakerIcon className="w-4 h-4" />
                  Crear Lote
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
