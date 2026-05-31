'use client';

import { useActionState } from 'react';
import {
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  saveObradorConfig,
  type ObradorConfigFormState,
} from '@/app/lib/actions/obrador-config';

export type ObradorConfigInitial = {
  businessName: string | null;
  companyName: string | null;
  nif: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  registryType: string | null;
  registryNumber: string | null;
  region: string | null;
  status: string;
  requestDate: Date | null;
  resolutionDate: Date | null;
} | null;

function dateValue(d: Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default function ObradorConfigForm({ initial }: { initial: ObradorConfigInitial }) {
  const [state, formAction] = useActionState<ObradorConfigFormState, FormData>(
    saveObradorConfig,
    { message: null },
  );

  const input =
    'w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
  const plain =
    'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <BuildingStorefrontIcon className="w-8 h-8 text-emerald-600" />
          Datos del Establecimiento
        </h1>
        <p className="text-slate-600 mt-1">
          Configura la información legal y técnica del obrador para el etiquetado y registros
          sanitarios.
        </p>
      </div>

      <form
        action={formAction}
        className="space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelCls}>Nombre Comercial</label>
            <div className="relative">
              <BuildingStorefrontIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                name="businessName"
                type="text"
                defaultValue={initial?.businessName ?? ''}
                placeholder="Ej. SOTOdelPRIOR Gourmet"
                className={input}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Razón Social</label>
            <input
              name="companyName"
              type="text"
              defaultValue={initial?.companyName ?? ''}
              placeholder="Ej. Restaurante Soto SL"
              className={plain}
            />
          </div>

          <div>
            <label className={labelCls}>NIF / CIF</label>
            <div className="relative">
              <IdentificationIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                name="nif"
                type="text"
                defaultValue={initial?.nif ?? ''}
                placeholder="B12345678"
                className={input}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Dirección Completa</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                name="address"
                type="text"
                defaultValue={initial?.address ?? ''}
                placeholder="Calle Mayor 1, 28001 Madrid"
                className={input}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Teléfono</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                name="phone"
                type="tel"
                defaultValue={initial?.phone ?? ''}
                placeholder="+34 600 000 000"
                className={input}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
              <input
                name="email"
                type="email"
                defaultValue={initial?.email ?? ''}
                placeholder="contacto@sotodelprior.com"
                className={input}
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
            Información Sanitaria
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Tipo de Registro</label>
              <select
                name="registryType"
                defaultValue={initial?.registryType ?? 'autonomico'}
                className={plain}
              >
                <option value="autonomico">Registro Autonómico / Minorista</option>
                <option value="rgseaa">RGSEAA (Nacional)</option>
                <option value="pendiente">Pendiente de confirmar</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Estado de Solicitud</label>
              <select name="status" defaultValue={initial?.status ?? 'no_iniciado'} className={plain}>
                <option value="no_iniciado">No Iniciado</option>
                <option value="preparacion">En Preparación</option>
                <option value="solicitado">Solicitado</option>
                <option value="aprobado">Aprobado / Activo</option>
                <option value="rechazado">Rechazado</option>
                <option value="subsanacion">Requiere Subsanación</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Número de Registro (si existe)</label>
              <input
                name="registryNumber"
                type="text"
                defaultValue={initial?.registryNumber ?? ''}
                placeholder="Ej. 26.0000000/M"
                className={plain}
              />
            </div>

            <div>
              <label className={labelCls}>Comunidad Autónoma</label>
              <input
                name="region"
                type="text"
                defaultValue={initial?.region ?? ''}
                placeholder="Castilla y León"
                className={plain}
              />
            </div>

            <div>
              <label className={labelCls}>Fecha de Solicitud</label>
              <input
                name="requestDate"
                type="date"
                defaultValue={dateValue(initial?.requestDate)}
                className={plain}
              />
            </div>

            <div>
              <label className={labelCls}>Fecha de Resolución</label>
              <input
                name="resolutionDate"
                type="date"
                defaultValue={dateValue(initial?.resolutionDate)}
                className={plain}
              />
            </div>
          </div>
        </div>

        {state.message && (
          <p className={`text-sm font-medium ${state.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
            {state.message}
          </p>
        )}

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
