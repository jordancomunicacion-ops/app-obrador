"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TagIcon } from "@heroicons/react/24/outline";
import { ensureSaleLabelForBatch } from "@/app/lib/actions/product-labels";

// Un clic: crea (o reutiliza) la etiqueta de venta del lote y abre su impresión.
// La etiqueta queda guardada en la sección Etiquetas para reimprimir.
export default function PrintBatchLabelButton({
  batchId,
  disabled,
}: {
  batchId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function handleClick() {
    setBusy(true);
    startTransition(async () => {
      try {
        const { id } = await ensureSaleLabelForBatch(batchId);
        window.open(`/dashboard/labels/${id}/print`, "_blank");
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      title={
        disabled
          ? "El lote no tiene ficha de producto"
          : "Crear / imprimir etiqueta de venta"
      }
      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <TagIcon className="w-4 h-4" />
      {busy ? "..." : "Etiqueta"}
    </button>
  );
}
