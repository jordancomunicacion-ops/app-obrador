"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "@/app/lib/actions/employee-requests";

type ReqType = "HOLIDAY" | "SICK_LEAVE" | "PERSONAL" | "SHIFT_SWAP" | "OTHER";

const TYPES: { value: ReqType; label: string; needsEnd: boolean }[] = [
  { value: "HOLIDAY", label: "Vacaciones", needsEnd: true },
  { value: "SICK_LEAVE", label: "Baja médica", needsEnd: true },
  { value: "PERSONAL", label: "Asuntos propios", needsEnd: true },
  { value: "SHIFT_SWAP", label: "Cambio de turno", needsEnd: false },
  { value: "OTHER", label: "Otro", needsEnd: true },
];

export default function RequestForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [type, setType] = useState<ReqType>("HOLIDAY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const meta = TYPES.find((t) => t.value === type)!;

  function handleSubmit() {
    if (!startDate) {
      alert("Fecha de inicio obligatoria");
      return;
    }
    setBusy(true);
    startTransition(async () => {
      try {
        await createRequest({
          type,
          startDate,
          endDate: meta.needsEnd ? endDate || null : null,
          reason,
        });
        setStartDate("");
        setEndDate("");
        setReason("");
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">Nueva solicitud</h3>

      <label className="block text-xs font-medium text-gray-600">
        Tipo
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ReqType)}
          className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-medium text-gray-600">
          Desde *
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>
        {meta.needsEnd && (
          <label className="block text-xs font-medium text-gray-600">
            Hasta
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        )}
      </div>

      <label className="block text-xs font-medium text-gray-600">
        Motivo
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Opcional..."
          className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
        />
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
      >
        {busy ? "Enviando..." : "Enviar solicitud"}
      </button>
    </div>
  );
}
