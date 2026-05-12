'use client';

import { useState } from 'react';
import { 
  BuildingStorefrontIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  IdentificationIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ObradorConfigPage() {
  const [status, setStatus] = useState('no_iniciado');
  const [registryType, setRegistryType] = useState('autonomico');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <BuildingStorefrontIcon className="w-8 h-8 text-emerald-600" />
          Datos del Establecimiento
        </h1>
        <p className="text-slate-600 mt-1">
          Configura la información legal y técnica del obrador para el etiquetado y registros sanitarios.
        </p>
      </div>

      <form className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial</label>
            <div className="relative">
              <BuildingStorefrontIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ej. SOTOdelPRIOR Gourmet"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
            <input 
              type="text" 
              placeholder="Ej. Restaurante Soto SL"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NIF / CIF</label>
            <div className="relative">
              <IdentificationIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="B12345678"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Completa</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Calle Mayor 1, 28001 Madrid"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="tel" 
                placeholder="+34 600 000 000"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                placeholder="contacto@sotodelprior.com"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Regulatory Info */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
            Información Sanitaria
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Registro</label>
              <select 
                value={registryType}
                onChange={(e) => setRegistryType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="autonomico">Registro Autonómico / Minorista</option>
                <option value="rgseaa">RGSEAA (Nacional)</option>
                <option value="pendiente">Pendiente de confirmar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado de Solicitud</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="no_iniciado">No Iniciado</option>
                <option value="preparacion">En Preparación</option>
                <option value="solicitado">Solicitado</option>
                <option value="aprobado">Aprobado / Activo</option>
                <option value="rechazado">Rechazado</option>
                <option value="subsanacion">Requiere Subsanación</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de Registro (si existe)</label>
              <input 
                type="text" 
                placeholder="Ej. 26.0000000/M"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comunidad Autónoma</label>
              <input 
                type="text" 
                placeholder="Castilla y León"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Solicitud</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Resolución</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}
