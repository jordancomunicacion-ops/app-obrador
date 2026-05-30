"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { receiveOrder } from "@/app/lib/actions/purchase-orders";

type Line = {
  id: string;
  productName: string;
  unit: string;
  quantity: number;
  receivedQuantity: number | null;
};

export default function DeliveryReceiver({
  orderId,
  lines,
}: {
  orderId: string;
  lines: Line[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [receivedQty, setReceivedQty] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const l of lines) m[l.id] = Math.max(0, l.quantity - (l.receivedQuantity ?? 0));
    return m;
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "deliveries");
      const res = await fetch("/api/uploads/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setPhotos((p) => [...p, json.url]);
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    const linesToSend = Object.entries(receivedQty)
      .filter(([, q]) => q > 0)
      .map(([lineId, qty]) => ({ lineId, qty }));

    if (linesToSend.length === 0 && photos.length === 0) {
      alert("Indica al menos una cantidad recibida o adjunta foto del albarán");
      return;
    }

    setBusy(true);
    startTransition(async () => {
      try {
        await receiveOrder(orderId, {
          receivedLines: linesToSend,
          photoUrls: photos,
          note,
        });
        router.push("/dashboard/today/deliveries");
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <h2 className="text-sm font-semibold mb-2">Cantidades recibidas</h2>
        <div className="space-y-2">
          {lines.map((l) => {
            const pending = Math.max(0, l.quantity - (l.receivedQuantity ?? 0));
            return (
              <div key={l.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.productName}</p>
                  <p className="text-xs text-gray-500">
                    Pedido: {l.quantity} {l.unit}
                    {l.receivedQuantity ? ` · Ya recibido: ${l.receivedQuantity}` : ""}
                  </p>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={pending * 2}
                  value={receivedQty[l.id] ?? 0}
                  onChange={(e) =>
                    setReceivedQty({
                      ...receivedQty,
                      [l.id]: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right font-mono tabular-nums"
                />
                <span className="text-xs text-gray-500 w-8">{l.unit}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <h2 className="text-sm font-semibold mb-2">Foto del albarán</h2>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {photos.map((url, i) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 bg-white border border-gray-300 rounded-full p-0.5"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1"
        >
          <CameraIcon className="w-3.5 h-3.5" />
          {uploading ? "..." : "Foto del albarán"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nota</label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Incidencias en la recepción (opcional)..."
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl inline-flex items-center justify-center gap-2"
      >
        <CheckCircleIcon className="w-5 h-5" />
        {busy ? "Procesando..." : "Confirmar recepción"}
      </button>
    </div>
  );
}
