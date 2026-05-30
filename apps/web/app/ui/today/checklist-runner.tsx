"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import PhotoCapture from "./photo-capture";
import { saveResponse, closeInstance } from "@/app/lib/actions/checklist-instances";

type FieldType = "TITLE" | "CHECK" | "TEXT" | "YES_NO" | "RATING_1_10";
type PhotoReq = "NONE" | "OPTIONAL" | "REQUIRED";

export type RunnerField = {
  id: string;
  order: number;
  type: FieldType;
  name: string;
  description: string | null;
  exampleImageUrl: string | null;
  photoRequirement: PhotoReq;
};

export type RunnerResponse = {
  fieldId: string;
  valueText: string | null;
  valueBool: boolean | null;
  valueRating: number | null;
  photoUrl: string | null;
  isIncident: boolean;
  incidentNote: string | null;
};

export default function ChecklistRunner({
  instanceId,
  templateName,
  fields,
  initialResponses,
  alreadyDone,
}: {
  instanceId: string;
  templateName: string;
  fields: RunnerField[];
  initialResponses: RunnerResponse[];
  alreadyDone: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [responses, setResponses] = useState<Record<string, RunnerResponse>>(() => {
    const m: Record<string, RunnerResponse> = {};
    for (const r of initialResponses) m[r.fieldId] = r;
    return m;
  });
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState<string | null>(null);

  const answerable = useMemo(() => fields.filter((f) => f.type !== "TITLE"), [fields]);
  const answered = answerable.filter((f) => isAnswered(f, responses[f.id]));
  const progress = answerable.length === 0 ? 100 : Math.round((answered.length / answerable.length) * 100);
  const missingRequired = answerable.filter(
    (f) => f.photoRequirement === "REQUIRED" && !responses[f.id]?.photoUrl,
  );

  function updateResponse(fieldId: string, patch: Partial<RunnerResponse>) {
    setResponses((prev) => {
      const curr = prev[fieldId] ?? {
        fieldId,
        valueText: null,
        valueBool: null,
        valueRating: null,
        photoUrl: null,
        isIncident: false,
        incidentNote: null,
      };
      const next = { ...curr, ...patch };
      // Auto-save
      setSavingFieldId(fieldId);
      startTransition(async () => {
        try {
          await saveResponse(instanceId, fieldId, {
            valueText: next.valueText,
            valueBool: next.valueBool,
            valueRating: next.valueRating,
            photoUrl: next.photoUrl,
            isIncident: next.isIncident,
            incidentNote: next.incidentNote,
          });
        } finally {
          setSavingFieldId((id) => (id === fieldId ? null : id));
        }
      });
      return { ...prev, [fieldId]: next };
    });
  }

  function handleClose() {
    if (missingRequired.length > 0) {
      alert(
        `Faltan fotos obligatorias en ${missingRequired.length} ${
          missingRequired.length === 1 ? "campo" : "campos"
        }`,
      );
      return;
    }
    if (!confirm("¿Cerrar el checklist? No podrás editarlo después.")) return;
    setClosing(true);
    startTransition(async () => {
      try {
        await closeInstance(instanceId);
        router.push("/dashboard/today");
      } finally {
        setClosing(false);
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Header sticky con progreso */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 -mx-6 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold text-gray-800 truncate">{templateName}</h1>
          <span className="text-sm font-medium text-gray-600">
            {answered.length}/{answerable.length}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {alreadyDone && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
            Este checklist ya está cerrado · solo lectura
          </p>
        )}
      </div>

      <div className="space-y-3 mt-4">
        {fields.map((field) => (
          <FieldCard
            key={field.id}
            field={field}
            response={responses[field.id]}
            saving={savingFieldId === field.id}
            disabled={alreadyDone}
            onChange={(patch) => updateResponse(field.id, patch)}
            onOpenIncident={() => setIncidentOpen(field.id)}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      {!alreadyDone && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4 z-20">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleClose}
              disabled={closing || answered.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {closing ? "Cerrando..." : "Enviar y cerrar checklist"}
            </button>
            {missingRequired.length > 0 && (
              <p className="text-xs text-red-600 mt-2 text-center">
                Faltan {missingRequired.length} {missingRequired.length === 1 ? "foto obligatoria" : "fotos obligatorias"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Incident modal */}
      {incidentOpen && (
        <IncidentModal
          initialNote={responses[incidentOpen]?.incidentNote ?? ""}
          onClose={() => setIncidentOpen(null)}
          onSave={(note) => {
            updateResponse(incidentOpen, { isIncident: true, incidentNote: note });
            setIncidentOpen(null);
          }}
        />
      )}
    </div>
  );
}

function isAnswered(field: RunnerField, r: RunnerResponse | undefined): boolean {
  if (!r) return false;
  switch (field.type) {
    case "CHECK":
      return r.valueBool === true;
    case "YES_NO":
      return r.valueBool !== null;
    case "TEXT":
      return !!(r.valueText && r.valueText.trim());
    case "RATING_1_10":
      return r.valueRating !== null;
    default:
      return false;
  }
}

function FieldCard({
  field,
  response,
  saving,
  disabled,
  onChange,
  onOpenIncident,
}: {
  field: RunnerField;
  response: RunnerResponse | undefined;
  saving: boolean;
  disabled: boolean;
  onChange: (patch: Partial<RunnerResponse>) => void;
  onOpenIncident: () => void;
}) {
  if (field.type === "TITLE") {
    return (
      <div className="pt-4 pb-2">
        <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider">{field.name}</h2>
        {field.description && <p className="text-sm text-gray-500 mt-1">{field.description}</p>}
      </div>
    );
  }

  const photoRequired = field.photoRequirement === "REQUIRED";
  const photoOptional = field.photoRequirement === "OPTIONAL";
  const showPhoto = photoRequired || photoOptional;

  return (
    <div
      className={clsx(
        "bg-white border-2 rounded-2xl p-4 transition-colors",
        response?.isIncident
          ? "border-red-300 bg-red-50/40"
          : isAnswered(field, response)
            ? "border-green-300 bg-green-50/30"
            : "border-gray-200",
      )}
    >
      <div className="flex items-start gap-3">
        {field.exampleImageUrl && (
          <img
            src={field.exampleImageUrl}
            alt=""
            className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-none"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800">{field.name}</h3>
          {field.description && (
            <p className="text-sm text-gray-500 mt-0.5">{field.description}</p>
          )}
        </div>
        {saving && <span className="text-xs text-gray-400">guardando…</span>}
      </div>

      {/* Control según tipo */}
      <div className="mt-4">
        {field.type === "CHECK" && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ valueBool: !response?.valueBool })}
            className={clsx(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium transition-colors",
              response?.valueBool
                ? "bg-green-600 border-green-600 text-white"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
            )}
          >
            <CheckIcon className="w-5 h-5" />
            {response?.valueBool ? "Hecho" : "Marcar como hecho"}
          </button>
        )}

        {field.type === "YES_NO" && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ valueBool: true })}
              className={clsx(
                "flex-1 py-3 rounded-xl border-2 font-medium transition-colors",
                response?.valueBool === true
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
              )}
            >
              Sí
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ valueBool: false })}
              className={clsx(
                "flex-1 py-3 rounded-xl border-2 font-medium transition-colors",
                response?.valueBool === false
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
              )}
            >
              No
            </button>
          </div>
        )}

        {field.type === "TEXT" && (
          <textarea
            disabled={disabled}
            rows={3}
            value={response?.valueText ?? ""}
            onChange={(e) => onChange({ valueText: e.target.value })}
            placeholder="Escribe tu respuesta…"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}

        {field.type === "RATING_1_10" && (
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ valueRating: n })}
                className={clsx(
                  "py-2 text-sm font-semibold rounded-lg border transition-colors",
                  response?.valueRating === n
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Foto */}
      {showPhoto && (
        <div className="mt-3">
          <PhotoCapture
            value={response?.photoUrl ?? null}
            onChange={(url) => onChange({ photoUrl: url })}
            required={photoRequired}
          />
        </div>
      )}

      {/* Incidencia */}
      {!disabled && (
        <div className="mt-3 flex items-center justify-between">
          {response?.isIncident ? (
            <div className="flex items-center gap-2 text-sm text-red-700">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="font-medium">Incidencia:</span>
              <span className="italic">
                {response.incidentNote || "sin nota"}
              </span>
              <button
                onClick={() => onChange({ isIncident: false, incidentNote: null })}
                className="text-xs text-red-600 hover:underline ml-2"
              >
                quitar
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenIncident}
              className="text-xs text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
            >
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              Marcar incidencia
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function IncidentModal({
  initialNote,
  onClose,
  onSave,
}: {
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Marcar incidencia</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe brevemente la incidencia…"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">
            Cancelar
          </button>
          <button
            onClick={() => onSave(note)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Marcar
          </button>
        </div>
      </div>
    </div>
  );
}
