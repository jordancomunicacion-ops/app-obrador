'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ClipboardDocumentCheckIcon, ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  createObradorDocument,
  type ObradorDocumentFormState,
} from '@/app/lib/actions/obrador-documents';
import { DOCUMENT_CATEGORIES } from '@/app/lib/obrador-constants';

export default function ObradorDocumentForm({
  locationId,
  returnTo,
}: {
  locationId?: string;
  returnTo?: string;
} = {}) {
  const [state, formAction] = useActionState<ObradorDocumentFormState, FormData>(
    createObradorDocument,
    { message: null, errors: {} },
  );

  const fieldCls = 'w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="p-6 max-w-2xl mx-auto pb-20">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={returnTo ?? "/dashboard/obrador/documents"}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-emerald-600" />
            Nuevo Documento
          </h1>
          <p className="text-slate-600 mt-1">Registra un expediente, certificado o plan.</p>
        </div>
      </div>

      <form
        action={formAction}
        className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
      >
        {locationId && <input type="hidden" name="locationId" value={locationId} />}
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <div>
          <label className={labelCls}>Título</label>
          <input
            name="title"
            type="text"
            className={fieldCls}
            placeholder="Ej. Plan APPCC - Obrador"
          />
          {state.errors?.title && (
            <p className="mt-1 text-sm text-rose-600">{state.errors.title[0]}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Categoría</label>
          <select name="category" defaultValue={DOCUMENT_CATEGORIES[0]} className={fieldCls}>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>URL del Documento</label>
          <input
            name="fileUrl"
            type="url"
            className={fieldCls}
            placeholder="https://drive.google.com/..."
          />
          <p className="mt-1 text-xs text-slate-400">
            Enlace al archivo (Drive, Dropbox, etc.). La subida directa de archivos llegará más
            adelante.
          </p>
          {state.errors?.fileUrl && (
            <p className="mt-1 text-sm text-rose-600">{state.errors.fileUrl[0]}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Fecha de Caducidad (opcional)</label>
          <input name="expiryDate" type="date" className={fieldCls} />
        </div>

        {state.message && <p className="text-sm text-rose-600 font-medium">{state.message}</p>}

        <div className="flex justify-end gap-4">
          <Link
            href={returnTo ?? "/dashboard/obrador/documents"}
            className="px-6 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            Guardar Documento
          </button>
        </div>
      </form>
    </div>
  );
}
