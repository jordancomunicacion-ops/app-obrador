"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { createEntry } from "@/app/lib/actions/financial-entries";

type EntryType =
  | "INCOME"
  | "EXPENSE_OPERATING"
  | "EXPENSE_PAYROLL"
  | "EXPENSE_SUPPLIER"
  | "EXPENSE_OTHER";

const TYPES: { value: EntryType; label: string; cls: string }[] = [
  { value: "INCOME", label: "Ingreso", cls: "bg-emerald-100 text-emerald-700" },
  { value: "EXPENSE_OPERATING", label: "Gasto operativo", cls: "bg-rose-100 text-rose-700" },
  { value: "EXPENSE_PAYROLL", label: "Nómina", cls: "bg-violet-100 text-violet-700" },
  { value: "EXPENSE_SUPPLIER", label: "Pago proveedor", cls: "bg-amber-100 text-amber-700" },
  { value: "EXPENSE_OTHER", label: "Otro gasto", cls: "bg-gray-200 text-gray-700" },
];

const CATEGORY_SUGGESTIONS: Record<EntryType, string[]> = {
  INCOME: ["Caja diaria", "Catering", "Eventos privados", "Otros ingresos"],
  EXPENSE_OPERATING: ["Materia prima", "Luz", "Agua", "Gas", "Alquiler", "Limpieza", "Reparaciones"],
  EXPENSE_PAYROLL: ["Nómina", "Seguridad Social", "Formación"],
  EXPENSE_SUPPLIER: ["Frutería", "Pescadería", "Carnicería", "Bebidas", "Limpieza"],
  EXPENSE_OTHER: ["Marketing", "Asesoría", "Impuestos", "Material oficina"],
};

export default function EntryForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [type, setType] = useState<EntryType>("EXPENSE_OPERATING");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "finance/receipts");
      const res = await fetch("/api/uploads/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setReceiptUrl(json.url);
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      alert("Importe debe ser positivo");
      return;
    }
    if (!category.trim()) {
      alert("Categoría obligatoria");
      return;
    }
    setBusy(true);
    startTransition(async () => {
      try {
        await createEntry({
          type,
          category,
          date,
          amount: num,
          description,
          receiptUrl,
        });
        setCategory("");
        setAmount("");
        setDescription("");
        setReceiptUrl(null);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <PlusIcon className="w-4 h-4" />
        Nuevo apunte
      </h3>

      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={clsx(
              "px-3 py-1 text-xs font-medium rounded-full border",
              type === t.value ? t.cls + " border-current" : "bg-white border-gray-300 text-gray-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="block text-xs font-medium text-gray-600 col-span-2">
          Categoría *
          <input
            type="text"
            list="categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Frutería"
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
          <datalist id="categories">
            {CATEGORY_SUGGESTIONS[type].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="block text-xs font-medium text-gray-600">
          Importe *
          <div className="mt-1 flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm text-right font-mono tabular-nums focus:outline-none"
              placeholder="0.00"
            />
            <span className="px-2 text-xs text-gray-500 bg-gray-50 border-l border-gray-200 self-stretch flex items-center">
              €
            </span>
          </div>
        </label>
      </div>

      <label className="block text-xs font-medium text-gray-600">
        Fecha *
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block text-xs font-medium text-gray-600">
        Descripción
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional..."
          className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
        />
      </label>

      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">Factura/ticket (opcional)</p>
        {receiptUrl ? (
          <div className="relative inline-block">
            <img
              src={receiptUrl}
              alt=""
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => setReceiptUrl(null)}
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
              {uploading ? "..." : "Foto factura"}
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg"
      >
        {busy ? "..." : "Añadir apunte"}
      </button>
    </div>
  );
}
