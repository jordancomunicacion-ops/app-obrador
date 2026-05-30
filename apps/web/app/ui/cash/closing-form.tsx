"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { createOrUpdateClosing } from "@/app/lib/actions/cash-closings";

type Shift = "MORNING" | "EVENING" | "FULL_DAY";

const SHIFTS: { value: Shift; label: string }[] = [
  { value: "MORNING", label: "Comida" },
  { value: "EVENING", label: "Cena" },
  { value: "FULL_DAY", label: "Día completo" },
];

type Initial = {
  date?: string;
  shift?: Shift;
  cashAmount?: number;
  expectedCashAmount?: number;
  cardAmount?: number;
  otherAmount?: number;
  tips?: number;
  notes?: string;
  photoUrl?: string | null;
};

export default function ClosingForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(initial?.date ?? today);
  const [shift, setShift] = useState<Shift>(initial?.shift ?? "FULL_DAY");
  const [cash, setCash] = useState<string>(String(initial?.cashAmount ?? ""));
  const [expectedCash, setExpectedCash] = useState<string>(
    String(initial?.expectedCashAmount ?? ""),
  );
  const [card, setCard] = useState<string>(String(initial?.cardAmount ?? ""));
  const [other, setOther] = useState<string>(String(initial?.otherAmount ?? ""));
  const [tips, setTips] = useState<string>(String(initial?.tips ?? ""));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const parsed = useMemo(
    () => ({
      cash: parseFloat(cash) || 0,
      expectedCash: parseFloat(expectedCash) || 0,
      card: parseFloat(card) || 0,
      other: parseFloat(other) || 0,
      tips: parseFloat(tips) || 0,
    }),
    [cash, expectedCash, card, other, tips],
  );
  const diff = parsed.cash - parsed.expectedCash;
  const totalIngresos = parsed.cash + parsed.card + parsed.other;

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "cash-closings");
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

  function handleSubmit() {
    setBusy(true);
    startTransition(async () => {
      try {
        await createOrUpdateClosing({
          date,
          shift,
          cashAmount: parsed.cash,
          expectedCashAmount: parsed.expectedCash,
          cardAmount: parsed.card,
          otherAmount: parsed.other,
          tips: parsed.tips,
          notes,
          photoUrl,
        });
        router.push("/dashboard/cash");
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
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
            Turno *
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as Shift)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              {SHIFTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Métodos de pago</h3>
        <MoneyInput label="Efectivo declarado" value={cash} onChange={setCash} accent="emerald" />
        <MoneyInput
          label="Efectivo esperado (TPV)"
          value={expectedCash}
          onChange={setExpectedCash}
          help="Lo que dice el TPV o caja registradora"
        />
        <MoneyInput label="Tarjeta" value={card} onChange={setCard} accent="sky" />
        <MoneyInput
          label="Otros (Bizum, transferencia…)"
          value={other}
          onChange={setOther}
          accent="violet"
        />
        <MoneyInput label="Propinas" value={tips} onChange={setTips} accent="amber" />
      </div>

      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 space-y-2">
        <Row label="Total ingresos" value={totalIngresos.toFixed(2)} bold />
        <Row label="Propinas" value={parsed.tips.toFixed(2)} />
        <Row
          label="Diferencia caja"
          value={`${diff > 0 ? "+" : ""}${diff.toFixed(2)}`}
          cls={
            Math.abs(diff) < 0.01
              ? "text-gray-700"
              : diff > 0
                ? "text-green-700"
                : "text-red-700"
          }
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <label className="block text-xs font-medium text-gray-600">
          Notas
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Foto del recuento (opcional)</p>
          {photoUrl ? (
            <div className="relative inline-block">
              <img
                src={photoUrl}
                alt=""
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
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

      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl inline-flex items-center justify-center gap-2"
      >
        <CheckCircleIcon className="w-5 h-5" />
        {busy ? "Guardando..." : "Guardar cierre"}
      </button>
    </div>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
  help,
  accent,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  help?: string;
  accent?: "emerald" | "sky" | "violet" | "amber";
}) {
  const accentCls =
    accent === "emerald"
      ? "border-emerald-200 focus-within:border-emerald-400"
      : accent === "sky"
        ? "border-sky-200 focus-within:border-sky-400"
        : accent === "violet"
          ? "border-violet-200 focus-within:border-violet-400"
          : accent === "amber"
            ? "border-amber-200 focus-within:border-amber-400"
            : "border-gray-200";
  return (
    <label className="block text-xs font-medium text-gray-600">
      {label}
      <div className={clsx("mt-1 flex items-center border-2 rounded-lg overflow-hidden", accentCls)}>
        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 text-sm text-right font-mono tabular-nums focus:outline-none"
          placeholder="0.00"
        />
        <span className="px-2 text-xs text-gray-500 bg-gray-50 border-l border-gray-200 self-stretch flex items-center">
          €
        </span>
      </div>
      {help && <span className="text-[10px] text-gray-400 italic">{help}</span>}
    </label>
  );
}

function Row({
  label,
  value,
  cls,
  bold,
}: {
  label: string;
  value: string;
  cls?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={clsx("text-sm", bold && "font-semibold")}>{label}</span>
      <span
        className={clsx("font-mono tabular-nums", bold && "text-lg font-bold", cls)}
      >
        {value} €
      </span>
    </div>
  );
}
