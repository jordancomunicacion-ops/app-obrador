"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, PrinterIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { createLabel } from "@/app/lib/actions/product-labels";

const ALLERGENS = [
  "Gluten",
  "Crustáceos",
  "Huevos",
  "Pescado",
  "Cacahuetes",
  "Soja",
  "Lácteos",
  "Frutos cáscara",
  "Apio",
  "Mostaza",
  "Sésamo",
  "Sulfitos",
  "Altramuces",
  "Moluscos",
];

const STORAGE_MODES: { value: "AMBIENT" | "REFRIGERATED" | "FROZEN"; label: string }[] = [
  { value: "AMBIENT", label: "Ambiente" },
  { value: "REFRIGERATED", label: "Refrigerado (0–4ºC)" },
  { value: "FROZEN", label: "Congelado (-18ºC)" },
];

export default function LabelForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [productName, setProductName] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [productionDate, setProductionDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState("");
  const [storageMode, setStorageMode] = useState<"AMBIENT" | "REFRIGERATED" | "FROZEN">(
    "REFRIGERATED",
  );
  const [allergens, setAllergens] = useState<string[]>([]);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "labels");
      const res = await fetch("/api/uploads/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setPhotoUrl(json.url);
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function toggleAllergen(a: string) {
    setAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function suggestExpiry(days: number) {
    const d = new Date(productionDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    setExpiryDate(d.toISOString().slice(0, 10));
  }

  function handleSubmit(printAfter: boolean) {
    if (!productName.trim()) {
      alert("Producto obligatorio");
      return;
    }
    setBusy(true);
    startTransition(async () => {
      try {
        const created = await createLabel({
          productName,
          lotNumber,
          productionDate,
          expiryDate: expiryDate || null,
          storageMode,
          allergens,
          weight,
          note,
          photoUrl,
        });
        if (printAfter) {
          window.open(`/dashboard/labels/${created.id}/print`, "_blank");
        }
        // Reset
        setProductName("");
        setLotNumber("");
        setExpiryDate("");
        setAllergens([]);
        setWeight("");
        setNote("");
        setPhotoUrl(null);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
        <label className="block text-xs font-medium text-gray-600">
          Producto *
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Crema de calabaza"
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-base"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-gray-600">
            Lote
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="L-2026-001"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Peso/cantidad
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="500 g"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-gray-600">
            Elaboración *
            <input
              type="date"
              value={productionDate}
              onChange={(e) => setProductionDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Caducidad
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { d: 1, l: "+1 día" },
            { d: 2, l: "+2 días" },
            { d: 3, l: "+3 días" },
            { d: 5, l: "+5 días" },
            { d: 7, l: "+7 días" },
            { d: 30, l: "+30 días" },
            { d: 90, l: "+90 días" },
          ].map((p) => (
            <button
              key={p.d}
              type="button"
              onClick={() => suggestExpiry(p.d)}
              className="text-xs px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50"
            >
              {p.l}
            </button>
          ))}
        </div>

        <label className="block text-xs font-medium text-gray-600">
          Conservación
          <select
            value={storageMode}
            onChange={(e) =>
              setStorageMode(e.target.value as "AMBIENT" | "REFRIGERATED" | "FROZEN")
            }
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {STORAGE_MODES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Alérgenos</p>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGENS.map((a) => {
              const active = allergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={
                    active
                      ? "px-2 py-0.5 text-xs font-medium rounded-full border bg-amber-50 text-amber-700 border-amber-300"
                      : "px-2 py-0.5 text-xs font-medium rounded-full border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block text-xs font-medium text-gray-600">
          Nota
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcional..."
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Foto (opcional)</p>
          {photoUrl ? (
            <div className="relative inline-block">
              <img
                src={photoUrl}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute -top-1 -right-1 bg-white border border-gray-300 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
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
                {uploading ? "..." : "Foto"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={busy}
          className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-medium px-4 py-3 rounded-xl"
        >
          {busy ? "..." : "Solo guardar"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={busy}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl inline-flex items-center justify-center gap-2"
        >
          <PrinterIcon className="w-5 h-5" />
          {busy ? "..." : "Guardar e imprimir"}
        </button>
      </div>
    </div>
  );
}
