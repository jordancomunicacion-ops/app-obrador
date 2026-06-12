"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignChecklistInstance } from "@/app/lib/actions/checklist-instances";

// onShift: true = en turno en la ventana de la tarea, false = fuera de turno,
// null = sin horario semanal en su ficha (no podemos saberlo).
type UserOpt = { id: string; name: string | null; onShift?: boolean | null };

export default function AssignInstanceControl({
  instanceId,
  assignedToUserId,
  users,
}: {
  instanceId: string;
  assignedToUserId: string | null;
  users: UserOpt[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(assignedToUserId ?? "");
  const [busy, setBusy] = useState(false);

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    setBusy(true);
    startTransition(async () => {
      try {
        await assignChecklistInstance(instanceId, next || null);
        router.refresh();
      } catch (e) {
        setValue(prev);
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  const onShift = users.filter((u) => u.onShift === true);
  const noSchedule = users.filter((u) => u.onShift == null);
  const offShift = users.filter((u) => u.onShift === false);
  const hasShiftInfo = onShift.length > 0 || offShift.length > 0;

  const renderOpts = (list: UserOpt[]) =>
    list.map((u) => (
      <option key={u.id} value={u.id}>
        {u.name ?? "—"}
      </option>
    ));

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => onChange(e.target.value)}
      className={
        "border rounded-lg px-2 py-1 text-sm disabled:opacity-50 " +
        (value
          ? "border-indigo-300 bg-indigo-50 text-indigo-800"
          : "border-gray-300 bg-white text-gray-600")
      }
    >
      <option value="">Sin asignar</option>
      {hasShiftInfo ? (
        <>
          {onShift.length > 0 && <optgroup label="En turno">{renderOpts(onShift)}</optgroup>}
          {noSchedule.length > 0 && (
            <optgroup label="Sin horario en ficha">{renderOpts(noSchedule)}</optgroup>
          )}
          {offShift.length > 0 && (
            <optgroup label="Fuera de turno">{renderOpts(offShift)}</optgroup>
          )}
        </>
      ) : (
        renderOpts(users)
      )}
    </select>
  );
}
