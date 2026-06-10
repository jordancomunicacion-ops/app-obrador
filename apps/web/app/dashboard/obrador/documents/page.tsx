import Link from 'next/link';
import {
  ClipboardDocumentCheckIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import DeleteObradorDocument from '@/app/ui/obrador/delete-document';

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function ObradorDocumentsPage() {
  const docs = await prisma.obradorSanitaryDocument.findMany({
    where: { ...(await locationScope()) },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-emerald-600" />
            Documentación Sanitaria
          </h1>
          <p className="text-slate-600 mt-1">
            Gestión centralizada de expedientes, certificados y planes.
          </p>
        </div>
        <Link
          href="/dashboard/obrador/documents/create"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <ArrowUpTrayIcon className="w-5 h-5" />
          Añadir Documento
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <DocumentIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            Aún no hay documentos. Añade el primero con “Añadir Documento”.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <DocumentIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{doc.title}</h4>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold uppercase">
                        {doc.category}
                      </span>
                      <span>Añadido el {fmtDate(doc.createdAt)}</span>
                      {doc.expiryDate && (
                        <span className="text-rose-500 font-medium">
                          Caduca {fmtDate(doc.expiryDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Ver documento"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </a>
                  <DeleteObradorDocument id={doc.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
