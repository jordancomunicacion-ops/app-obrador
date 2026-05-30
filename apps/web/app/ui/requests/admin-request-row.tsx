"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { approveRequest, rejectRequest } from "@/app/lib/actions/employee-requests";

type Req = {
  id: string;
  workerName: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  reason: string | null;
  decision: string | null;
  resolverName: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  HOLIDAY: "Vacaciones",
  SICK_LEAVE: "Baja médica",
  PERSONAL: "Asuntos propios",
  SHIFT_SWAP: "Cambio turno",
  OTHER: "Otro",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Aprobada", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rechazada", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelada", cls: "bg-gray-100 text-gray-600" },
};

export default function AdminRequestRow({ request }: { request: Req }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showDecisionInput, setShowDecisionInput] = useState(false);
  const [decision, setDecision] = useState("");
  const [busy, setBusy] = useState(false);

  function handleAction(kind: "approve" | "reject") {
    setBusy(true);
    startTransition(async () => {
      try {
        if (kind === "approve") await approveRequest(request.id, decision);
        else await rejectRequest(request.id, decision);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  const status = STATUS_META[request.status] ?? STATUS_META.PENDING;
  const start = new Date(request.startDate).toLocaleDateString("es-ES");
  const end = request.endDate
    ? new Date(request.endDate).toLocaleDateString("es-ES")
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800">{request.workerName}</p>
          <span className="text-xs text-gray-500">·</span>
          <p className="text-sm text-gray-600">{TYPE_LABEL[request.type]}</p>
        </div>
        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", status.cls)}>
          {status.label}
        </span>
      </div>

      <p className="text-xs text-gray-500">
        {start}
        {end && ` → ${end}`}
        <span className="text-gray-400"> · solicitada {new Date(request.createdAt).toLocaleDateString("es-ES")}</span>
      </p>
      {request.reason && (
        <p className="text-sm text-gray-700 mt-2 italic">"{request.reason}"</p>
      )}
      {request.decision && (
        <p className="text-xs text-gray-500 mt-1">
          {request.status === "APPROVED" ? "✓" : "✕"} {request.resolverName ?? "Admin"}: "{request.decision}"
        </p>
      )}

      {request.status === "PENDING" && (
        <div className="mt-3">
          {showDecisionInput ? (
            <div className="space-y-2">
              <input
                type="text"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="Comentario (opcional)..."
                className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAction("approve")}
                  disabled={busy}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center justify-center gap-1"
                >
                  <CheckIcon className="w-4 h-4" />
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("reject")}
                  disabled={busy}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center justify-center gap-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDecisionInput(false)}
                  className="text-xs text-gray-500 px-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDecisionInput(true)}
              className="text-xs text-indigo-600 hover:underline"
            >
              Responder...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
