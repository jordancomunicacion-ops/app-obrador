"use client";

import { useState, useTransition } from "react";
import { ArrowPathIcon, EyeIcon, EyeSlashIcon, ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";
import { rotateIntegrationKey } from "@/app/lib/actions/integration-key";

export default function IntegrationKeyPanel({ initialKey }: { initialKey: string | null }) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentKey, setCurrentKey] = useState(initialKey ?? "");
  const [isPending, startTransition] = useTransition();

  function rotate() {
    if (
      currentKey &&
      !confirm("Se generará una nueva clave. El CRM dejará de sincronizar hasta actualizarla. ¿Continuar?")
    )
      return;
    startTransition(async () => {
      const res = await rotateIntegrationKey();
      if (!res.ok) {
        alert(res.error);
        return;
      }
      setCurrentKey(res.key);
      setReveal(true);
    });
  }

  function copy() {
    if (!currentKey) return;
    navigator.clipboard.writeText(currentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const masked = currentKey
    ? currentKey.slice(0, 6) + "•".repeat(Math.max(0, currentKey.length - 10)) + currentKey.slice(-4)
    : "—";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">API key integración (CRM)</h2>
        <p className="text-sm text-slate-500 mt-1">
          Pega esta clave en el CRM (Conexiones → Cocina) para que sincronice los operarios y las
          tareas de esta cuenta. Sólo lectura.
        </p>
      </div>

      <div className="rounded-md bg-slate-50 border border-slate-200 p-3 font-mono text-sm break-all">
        {currentKey ? (reveal ? currentKey : masked) : "Sin clave generada"}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          disabled={!currentKey}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          {reveal ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          {reveal ? "Ocultar" : "Mostrar"}
        </button>
        <button
          type="button"
          onClick={copy}
          disabled={!currentKey}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-emerald-600" /> : <ClipboardIcon className="w-4 h-4" />}
          {copied ? "Copiada" : "Copiar"}
        </button>
        <button
          type="button"
          onClick={rotate}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 disabled:opacity-60 ml-auto"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          {currentKey ? "Rotar" : "Generar"}
        </button>
      </div>

      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer hover:text-slate-700">Endpoints expuestos al CRM</summary>
        <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-md overflow-x-auto">{`GET /api/integrations/employees
GET /api/integrations/tasks?from=2026-06-01&to=2026-06-30

Cabecera:  x-api-key: <API_KEY>`}</pre>
      </details>
    </div>
  );
}
