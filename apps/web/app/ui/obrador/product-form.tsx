'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import {
  ArchiveBoxIcon,
  TagIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  CheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  OBRADOR_ALLERGENS,
  type ObradorProductFormState,
} from '@/app/lib/actions/obrador-products';

export type ObradorProductInitial = {
  id: string;
  name: string;
  category: string | null;
  sanitaryInfo: {
    legalDenomination: string | null;
    conservationType: string | null;
    shelfLifeDays: number | null;
    ingredientsList: string | null;
    allergens: string | null;
    energyKcal: number | null;
    fat: number | null;
    saturatedFat: number | null;
    carbs: number | null;
    sugars: number | null;
    protein: number | null;
    salt: number | null;
  } | null;
};

const CATEGORIES = ['Carne fresca', 'Carne picada', 'Embutido', 'Panadería', 'Otro'];
const CONSERVATION = ['Refrigerado (0-4ºC)', 'Congelado (-18ºC)', 'Ambiente (Fresco y seco)'];

const NUTRIENTS: { name: string; label: string }[] = [
  { name: 'energyKcal', label: 'Valor Energético (kcal)' },
  { name: 'fat', label: 'Grasas (g)' },
  { name: 'saturatedFat', label: 'Saturadas (g)' },
  { name: 'carbs', label: 'H. Carbono (g)' },
  { name: 'sugars', label: 'Azúcares (g)' },
  { name: 'protein', label: 'Proteínas (g)' },
  { name: 'salt', label: 'Sal (g)' },
];

export default function ObradorProductForm({
  action,
  initial,
}: {
  action: (
    prevState: ObradorProductFormState,
    formData: FormData,
  ) => Promise<ObradorProductFormState>;
  initial?: ObradorProductInitial;
}) {
  const [state, formAction] = useActionState<ObradorProductFormState, FormData>(action, {
    message: null,
    errors: {},
  });

  const s = initial?.sanitaryInfo ?? null;
  const selectedAllergens = s?.allergens
    ? s.allergens.split(',').map((a) => a.trim())
    : [];
  const nutrientValue: Record<string, number | null | undefined> = {
    energyKcal: s?.energyKcal,
    fat: s?.fat,
    saturatedFat: s?.saturatedFat,
    carbs: s?.carbs,
    sugars: s?.sugars,
    protein: s?.protein,
    salt: s?.salt,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto pb-20">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/obrador/products"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <ArchiveBoxIcon className="w-8 h-8 text-emerald-600" />
              {initial ? 'Editar Producto Envasado' : 'Nuevo Producto Envasado'}
            </h1>
            <p className="text-slate-600 mt-1">Configura la ficha técnica y legal del producto.</p>
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-8">
        {/* Step 1: Basic Info */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-emerald-600" />
            Información Básica y Denominación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial</label>
              <input
                name="name"
                type="text"
                defaultValue={initial?.name ?? ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej. Hamburguesa de Ternera Premium"
              />
              {state.errors?.name && (
                <p className="mt-1 text-sm text-rose-600">{state.errors.name[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select
                name="category"
                defaultValue={initial?.category ?? CATEGORIES[0]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Denominación Legal</label>
              <input
                name="legalDenomination"
                type="text"
                defaultValue={s?.legalDenomination ?? ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej. Preparado de carne picada de vacuno"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Conservación</label>
              <select
                name="conservationType"
                defaultValue={s?.conservationType ?? CONSERVATION[0]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {CONSERVATION.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vida Útil (Días)</label>
              <input
                name="shelfLifeDays"
                type="number"
                defaultValue={s?.shelfLifeDays ?? ''}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Ej. 3"
              />
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
            <label className="block text-sm font-medium mb-2 text-rose-800">
              Seleccionar Alérgenos (Se destacarán en la etiqueta)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {OBRADOR_ALLERGENS.map((allergen) => (
                <label
                  key={allergen}
                  className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-rose-300 has-[:checked]:bg-rose-600 has-[:checked]:text-white has-[:checked]:border-rose-600 has-[:checked]:shadow-sm text-center"
                >
                  <input
                    type="checkbox"
                    name="allergens"
                    value={allergen}
                    defaultChecked={selectedAllergens.includes(allergen)}
                    className="sr-only"
                  />
                  {allergen}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lista de Ingredientes (Orden decreciente)
            </label>
            <textarea
              name="ingredientsList"
              rows={4}
              defaultValue={s?.ingredientsList ?? ''}
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
            {NUTRIENTS.map((n) => (
              <div key={n.name}>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">
                  {n.label}
                </label>
                <input
                  name={n.name}
                  type="number"
                  step="0.1"
                  defaultValue={nutrientValue[n.name] ?? ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {state.message && (
          <p className="text-sm text-rose-600 font-medium">{state.message}</p>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-end gap-4 shadow-2xl z-10 md:static md:bg-transparent md:border-0 md:shadow-none md:px-0">
          <Link
            href="/dashboard/obrador/products"
            className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            {initial ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
