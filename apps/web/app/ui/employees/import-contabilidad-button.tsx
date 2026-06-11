'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { importEmployeesFromContabilidad } from '@/app/lib/actions/employees';

/**
 * Importación masiva de la plantilla desde el ERP de contabilidad: da de alta
 * a los empleados que falten (cruce por DNI) y actualiza contrato/jornada de
 * los que ya existen. El local se asigna por el centro de trabajo del ERP.
 */
export default function ImportContabilidadButton() {
    const router = useRouter();
    const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
    const [importing, startImport] = useTransition();

    function handleImport() {
        setResult(null);
        startImport(async () => {
            const res = await importEmployeesFromContabilidad();
            if (!res.ok) {
                setResult({ ok: false, text: res.message });
                return;
            }
            const partes = [
                res.created ? `${res.created} dado${res.created === 1 ? '' : 's'} de alta` : null,
                res.updated ? `${res.updated} actualizado${res.updated === 1 ? '' : 's'}` : null,
            ].filter(Boolean);
            setResult({
                ok: true,
                text: partes.length
                    ? `Plantilla importada: ${partes.join(', ')}.`
                    : res.message ?? 'No había nada que importar.',
            });
            router.refresh();
        });
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="flex h-10 items-center gap-2 rounded-lg bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            >
                <ArrowDownTrayIcon className="h-5 w-5" />
                {importing ? 'Importando...' : 'Importar de contabilidad'}
            </button>
            {result && (
                <p className={`text-xs ${result.ok ? 'text-emerald-600' : 'text-red-500'}`}>{result.text}</p>
            )}
        </div>
    );
}
