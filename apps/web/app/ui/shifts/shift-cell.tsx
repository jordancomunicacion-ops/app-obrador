"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { createShift, updateShift, deleteShift } from "@/app/lib/actions/shifts";

type ShiftView = {
  id: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  note: string | null;
  locationName: string | null;
};

export default function ShiftCell({
  workerId,
  dateISO,
  shift,
}: {
  workerId: string;
  dateISO: string;
  shift: ShiftView | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(shift?.startTime ?? "09:00");
  const [end, setEnd] = useState(shift?.endTime ?? "17:00");
  const [breakMin, setBreakMin] = useState(shift?.breakMinutes ?? 0);
  const [note, setNote] = useState(shift?.note ?? "");
  const [busy, setBusy] = useState(false);

  function handleSave() {
    setBusy(true);
    startTransition(async () => {
      try {
        if (shift) {
          await updateShift(shift.id, {
            startTime: start,
            endTime: end,
            breakMinutes: breakMin,
            note,
          });
        } else {
          await createShift({
            workerId,
            date: dateISO,
            startTime: start,
            endTime: end,
            breakMinutes: breakMin,
            note,
          });
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  function handleDelete() {
    if (!shift) return;
    if (!confirm("¿Borrar este turno?")) return;
    setBusy(true);
    startTransition(async () => {
      try {
        await deleteShift(shift.id);
        setOpen(false);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <>
      {shift ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left bg-indigo-50 border border-indigo-200 rounded px-1.5 py-1 hover:bg-indigo-100 transition-colors"
        >
          <p className="text-xs font-mono font-semibold text-indigo-800 tabular-nums">
            {shift.startTime}–{shift.endTime}
          </p>
          {shift.breakMinutes > 0 && (
            <p className="text-[10px] text-indigo-600">pausa {shift.breakMinutes}m</p>
          )}
          {shift.note && (
            <p className="text-[10px] text-indigo-600 italic truncate">{shift.note}</p>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-full min-h-[40px] border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-300 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              {shift ? "Editar turno" : "Nuevo turno"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {new Date(dateISO + "T00:00:00Z").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-medium text-gray-600">
                  Entrada
                  <input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Salida
                  <input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-gray-600">
                Pausa (minutos)
                <input
                  type="number"
                  min={0}
                  value={breakMin}
                  onChange={(e) => setBreakMin(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                Nota
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Opcional..."
                  className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="flex items-center justify-between gap-2 mt-5">
              {shift && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Borrar
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-gray-600 px-3 py-1.5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={busy}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
                >
                  {busy ? "..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
