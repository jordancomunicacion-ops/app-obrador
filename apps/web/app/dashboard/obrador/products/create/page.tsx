'use client';

import { useState } from 'react';
import { 
  ArchiveBoxIcon, 
  BeakerIcon, 
  TagIcon, 
  ExclamationTriangleIcon,
  ScaleIcon,
  CheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const ALLERGENS = [
  'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes', 'Soja', 'Leche', 
  'Frutos de cáscara', 'Apio', 'Mostaza', 'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos'
];

export default function CreateObradorProductPage() {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  
  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev => 
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/obrador/products" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <ArchiveBoxIcon className="w-8 h-8 text-emerald-600" />
              Nuevo Producto Envasado
            </h1>
            <p className="text-slate-600 mt-1">Configura la ficha técnica y legal del producto.</p>
          </div>
        </div>
      </div>

      <form className="space-y-8">
        {/* Step 1: Basic Info */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-emerald-600" />
            Información Básica y Denominación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial</label>
              <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Ej. Hamburguesa de Ternera Premium" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option>Carne fresca</option>
                <option>Carne picada</option>
                <option>Embutido</option>
                <option>Panadería</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Denominación Legal</label>
              <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Ej. Preparado de carne picada de vacuno" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Conservación</label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option>Refrigerado (0-4ºC)</option>
                <option>Congelado (-18ºC)</option>
                <option>Ambiente (Fresco y seco)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vida Útil (Días)</label>
              <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Ej. 3" />
            </div>
          </div>
        </div>

        {/* Step 2: Allergens & Ingredients */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-600" />
            Composición y Alérgenos
          </h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2 text-rose-800">Seleccionar Alérgenos (Se destacarán en la etiqueta)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {ALLERGENS.map(allergen => (
                <button
                  key={allergen}
                  type="button"
                  onClick={() => toggleAllergen(allergen)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    selectedAllergens.includes(allergen)
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'
                  }`}
                >
                  {allergen}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lista de Ingredientes (Orden decreciente)</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Ej. Carne de vacuno (95%), agua, sal, antioxidantes (E-301, E-331)..."
            />
          </div>
        </div>

        {/* Step 3: Nutritional Info */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <ScaleIcon className="w-5 h-5 text-blue-600" />
            Información Nutricional (por 100g)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Valor Energético (kcal)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Grasas (g)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Saturadas (g)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">H. Carbono (g)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Azúcares (g)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Proteínas (g)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Sal (g)</label>
              <input type="number" step="0.1" className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-end gap-4 shadow-2xl z-10 md:static md:bg-transparent md:border-0 md:shadow-none md:px-0">
          <Link href="/dashboard/obrador/products" className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all">
            Cancelar
          </Link>
          <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
            <CheckIcon className="w-5 h-5" />
            Crear Producto
          </button>
        </div>
      </form>
    </div>
  );
}
