"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { copyWeek } from "@/app/lib/actions/shifts";

export default function CopyWeekButton({
  fromMondayISO,
  toMondayISO,
}: {
  fromMondayISO: string;
  toMondayISO: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handle() {
    if (
      !confirm(
        `Copiar todos los turnos de la semana del ${fromMondayISO} a la del ${toMondayISO}? (no sobrescribe los existentes, añade)`,
      )
    )
      return;
    startTransition(async () => {
      try {
        const result = await copyWeek(fromMondayISO, toMondayISO);
        router.refresh();
        alert(`${result.created} turnos copiados.`);
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
    >
      <DocumentDuplicateIcon className="w-4 h-4" />
      {pending ? "Copiando..." : "Copiar semana anterior"}
    </button>
  );
}
