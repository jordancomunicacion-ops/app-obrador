"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignChecklistInstance } from "@/app/lib/actions/checklist-instances";

type UserOpt = { id: string; name: string | null };

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
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name ?? "—"}
        </option>
      ))}
    </select>
  );
}
