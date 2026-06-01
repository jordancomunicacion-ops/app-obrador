"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteProductionRoutine } from "@/app/lib/actions/production-routines";

export default function DeleteRoutineButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`¿Eliminar el ciclo "${title}"? Las tareas ya generadas se conservan.`)) return;
    startTransition(async () => {
      try {
        await deleteProductionRoutine(id);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title="Eliminar ciclo"
      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  );
}
