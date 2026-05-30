"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { cancelMyRequest } from "@/app/lib/actions/employee-requests";

type Req = {
  id: string;
  type: string;
  status: string;
  startDate: string; // ISO
  endDate: string | null;
  reason: string | null;
  decision: string | null;
  resolvedAt: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  HOLIDAY: "Vacaciones",
  SICK_LEAVE: "Baja médica",
  PERSONAL: "Asuntos propios",
  SHIFT_SWAP: "Cambio de turno",
  OTHER: "Otro",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Aprobada", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rechazada", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelada", cls: "bg-gray-100 text-gray-600" },
};

export default function MyRequestRow({ request }: { request: Req }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleCancel() {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    startTransition(async () => {
      try {
        await cancelMyRequest(request.id);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
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
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-800">{TYPE_LABEL[request.type]}</p>
        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", status.cls)}>
          {status.label}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {start}
        {end && ` → ${end}`}
      </p>
      {request.reason && (
        <p className="text-xs text-gray-600 mt-1 italic">"{request.reason}"</p>
      )}
      {request.decision && (
        <p className="text-xs text-gray-500 mt-1">
          Decisión: <span className="italic">"{request.decision}"</span>
        </p>
      )}
      {request.status === "PENDING" && (
        <button
          type="button"
          onClick={handleCancel}
          className="mt-2 text-xs text-red-600 hover:underline"
        >
          Cancelar solicitud
        </button>
      )}
    </div>
  );
}
