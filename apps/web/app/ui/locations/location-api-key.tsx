"use client";

import { useState, useTransition } from "react";
import {
    ArrowPathIcon,
    CheckIcon,
    ClipboardIcon,
    EyeIcon,
    EyeSlashIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { rotateIntegrationKey, revokeIntegrationKey } from "@/app/lib/actions/integration-key";

export default function LocationApiKey({
    locationId,
    initialKey,
    initialCreatedAt,
}: {
    locationId: string;
    initialKey: string | null;
    initialCreatedAt: string | null;
}) {
    const [key, setKey] = useState<string | null>(initialKey);
    const [createdAt, setCreatedAt] = useState<string | null>(initialCreatedAt);
    const [reveal, setReveal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [busy, startTransition] = useTransition();

    function copy() {
        if (!key) return;
        navigator.clipboard.writeText(key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function rotate() {
        if (key && !confirm("Se generará una nueva clave para este local. Las apps conectadas (CRM, Contabilidad) dejarán de sincronizarlo hasta actualizar la clave en cada una. ¿Continuar?")) return;
        startTransition(async () => {
            const res = await rotateIntegrationKey(locationId);
            if (!res.ok) { alert(res.error); return; }
            setKey(res.key);
            setCreatedAt(new Date().toISOString());
            setReveal(true);
        });
    }

    function revoke() {
        if (!confirm("¿Revocar la clave? Las apps conectadas (CRM, Contabilidad) dejarán de sincronizar este local.")) return;
        startTransition(async () => {
            const res = await revokeIntegrationKey(locationId);
            if (!res.ok) { alert(res.error); return; }
            setKey(null);
            setCreatedAt(null);
        });
    }

    const masked = key
        ? key.slice(0, 6) + "•".repeat(Math.max(0, key.length - 10)) + key.slice(-4)
        : "";

    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm break-all min-h-[44px]">
                {key ? (reveal ? key : masked) : <span className="text-slate-400">Sin clave generada</span>}
            </div>

            {key && createdAt && (
                <p className="text-xs text-slate-500">
                    Activa desde {new Date(createdAt).toLocaleDateString()}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setReveal((v) => !v)}
                    disabled={!key}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                    {reveal ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    {reveal ? "Ocultar" : "Mostrar"}
                </button>
                <button
                    type="button"
                    onClick={copy}
                    disabled={!key}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                    {copied ? <CheckIcon className="w-4 h-4 text-emerald-600" /> : <ClipboardIcon className="w-4 h-4" />}
                    {copied ? "Copiada" : "Copiar"}
                </button>
                {key && (
                    <button
                        type="button"
                        onClick={revoke}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Revocar
                    </button>
                )}
                <button
                    type="button"
                    onClick={rotate}
                    disabled={busy}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
                    {key ? "Rotar" : "Generar"}
                </button>
            </div>
        </div>
    );
}
