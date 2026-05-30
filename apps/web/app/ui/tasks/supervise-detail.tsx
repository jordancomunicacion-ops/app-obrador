"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import {
  markResponseSupervised,
  markInstanceSupervised,
} from "@/app/lib/actions/checklist-supervise";

type FieldType = "TITLE" | "CHECK" | "TEXT" | "YES_NO" | "RATING_1_10";

type Row = {
  fieldId: string;
  fieldName: string;
  fieldType: FieldType;
  fieldOrder: number;
  responseId: string | null;
  valueText: string | null;
  valueBool: boolean | null;
  valueRating: number | null;
  photoUrl: string | null;
  isIncident: boolean;
  incidentNote: string | null;
  supervisedAt: Date | null;
  supervisedByName: string | null;
  answeredByName: string | null;
};

export default function SuperviseDetail({
  instanceId,
  rows,
}: {
  instanceId: string;
  rows: Row[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [supervisedMap, setSupervisedMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const r of rows) {
      if (r.responseId) m[r.responseId] = r.supervisedAt !== null;
    }
    return m;
  });

  function toggle(responseId: string) {
    const next = !supervisedMap[responseId];
    setSupervisedMap((m) => ({ ...m, [responseId]: next }));
    startTransition(async () => {
      try {
        await markResponseSupervised(responseId, next);
      } catch (e) {
        setSupervisedMap((m) => ({ ...m, [responseId]: !next }));
        alert((e as Error).message);
      }
    });
  }

  function supervisAll() {
    startTransition(async () => {
      await markInstanceSupervised(instanceId);
      router.refresh();
    });
  }

  const answerable = rows.filter((r) => r.fieldType !== "TITLE" && r.responseId);
  const supervisedCount = answerable.filter((r) => r.responseId && supervisedMap[r.responseId]).length;
  const allSupervised = answerable.length > 0 && supervisedCount === answerable.length;

  return (
    <div>
      <div className="flex items-center justify-between sticky top-0 bg-white border-b border-gray-200 py-3 z-10">
        <p className="text-sm text-gray-600">
          {supervisedCount}/{answerable.length} supervisadas
        </p>
        <button
          onClick={supervisAll}
          disabled={allSupervised}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {allSupervised ? "✓ Todas supervisadas" : "Marcar todas como supervisadas"}
        </button>
      </div>

      <div className="space-y-2 mt-4">
        {rows.map((r) => {
          if (r.fieldType === "TITLE") {
            return (
              <h3
                key={r.fieldId}
                className="pt-3 text-sm font-bold text-gray-700 uppercase tracking-wider"
              >
                {r.fieldName}
              </h3>
            );
          }
          const sup = r.responseId ? supervisedMap[r.responseId] : false;
          return (
            <div
              key={r.fieldId}
              className={clsx(
                "border-2 rounded-xl p-3 transition-colors",
                r.isIncident
                  ? "border-red-300 bg-red-50/30"
                  : sup
                    ? "border-green-300 bg-green-50/30"
                    : "border-gray-200 bg-white",
              )}
            >
              <div className="flex items-start gap-3">
                {r.photoUrl ? (
                  <a href={r.photoUrl} target="_blank" rel="noreferrer" className="flex-none">
                    <img
                      src={r.photoUrl}
                      alt="Evidencia"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-90"
                    />
                  </a>
                ) : (
                  <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-none">
                    <PhotoIcon className="w-6 h-6 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{r.fieldName}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {renderValue(r)}
                  </p>
                  {r.isIncident && (
                    <p className="mt-1 text-xs text-red-700 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                      Incidencia: {r.incidentNote || "sin nota"}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {r.answeredByName ? `Por ${r.answeredByName}` : ""}
                    {r.supervisedAt &&
                      r.supervisedByName &&
                      ` · Supervisada por ${r.supervisedByName}`}
                  </p>
                </div>
                {r.responseId && (
                  <button
                    onClick={() => toggle(r.responseId!)}
                    className={clsx(
                      "p-2 rounded-lg transition-colors flex-none",
                      sup
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-white border-2 border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500",
                    )}
                    aria-label={sup ? "Quitar supervisión" : "Marcar como supervisado"}
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderValue(r: Row): string {
  switch (r.fieldType) {
    case "CHECK":
      return r.valueBool === true ? "✓ Hecho" : "(no marcado)";
    case "YES_NO":
      return r.valueBool === true ? "Sí" : r.valueBool === false ? "No" : "(sin respuesta)";
    case "TEXT":
      return r.valueText ?? "(sin respuesta)";
    case "RATING_1_10":
      return r.valueRating !== null ? `Valoración: ${r.valueRating}/10` : "(sin respuesta)";
    default:
      return "";
  }
}
