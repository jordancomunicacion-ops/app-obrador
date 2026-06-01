"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  createProductionRoutine,
  updateProductionRoutine,
  type ProductionRoutineInput,
} from "@/app/lib/actions/production-routines";

type Frequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMIANNUAL"
  | "ANNUAL";

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "DAILY", label: "Diario" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL", label: "Anual" },
];

const WEEKDAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

type Opt = { id: string; name: string | null };

type FormState = {
  title: string;
  description: string;
  recipeId: string;
  action: string;
  technique: string;
  targetQuantity: string;
  unit: string;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  excludeWeekdays: number[];
  executionTime: string;
  defaultAssigneeUserId: string;
  locationId: string;
  isActive: boolean;
};

export default function ProductionRoutineForm({
  recipes,
  locations,
  users,
  initial,
  initialId,
}: {
  recipes: Opt[];
  locations: Opt[];
  users: Opt[];
  initial?: FormState;
  initialId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const [d, setD] = useState<FormState>(
    initial ?? {
      title: "",
      description: "",
      recipeId: "",
      action: "",
      technique: "",
      targetQuantity: "",
      unit: "",
      frequency: "DAILY",
      startDate: today,
      endDate: "",
      excludeWeekdays: [],
      executionTime: "08:00",
      defaultAssigneeUserId: "",
      locationId: "",
      isActive: true,
    },
  );

  function toggleWeekday(v: number) {
    setD((s) => ({
      ...s,
      excludeWeekdays: s.excludeWeekdays.includes(v)
        ? s.excludeWeekdays.filter((x) => x !== v)
        : [...s.excludeWeekdays, v],
    }));
  }

  function handleSubmit() {
    if (!d.title.trim()) {
      alert("El título es obligatorio");
      return;
    }
    const payload: ProductionRoutineInput = {
      title: d.title,
      description: d.description || null,
      recipeId: d.recipeId || null,
      action: d.action || null,
      technique: d.technique || null,
      targetQuantity: d.targetQuantity ? Number(d.targetQuantity) : null,
      unit: d.unit || null,
      frequency: d.frequency,
      startDate: d.startDate,
      endDate: d.endDate || null,
      excludeWeekdays: d.excludeWeekdays,
      executionTime: d.executionTime || null,
      defaultAssigneeUserId: d.defaultAssigneeUserId || null,
      locationId: d.locationId || null,
      isActive: d.isActive,
    };
    startTransition(async () => {
      try {
        if (initialId) await updateProductionRoutine(initialId, payload);
        else await createProductionRoutine(payload);
        router.push("/dashboard/tasks/routines");
        router.refresh();
      } catch (e) {
        alert("Error: " + (e as Error).message);
      }
    });
  }

  const inputCls =
    "mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <label className="block text-xs font-medium text-gray-600">
          Título *
          <input
            type="text"
            value={d.title}
            onChange={(e) => setD({ ...d, title: e.target.value })}
            placeholder="Mise en place cámara fría"
            className={inputCls}
          />
        </label>

        <label className="block text-xs font-medium text-gray-600">
          Descripción
          <input
            type="text"
            value={d.description}
            onChange={(e) => setD({ ...d, description: e.target.value })}
            className={inputCls}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-gray-600">
            Receta (opcional)
            <select
              value={d.recipeId}
              onChange={(e) => setD({ ...d, recipeId: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Local
            <select
              value={d.locationId}
              onChange={(e) => setD({ ...d, locationId: e.target.value })}
              className={inputCls}
            >
              <option value="">Todos / sin local</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Acción
            <input
              type="text"
              value={d.action}
              onChange={(e) => setD({ ...d, action: e.target.value })}
              placeholder="LIMPIEZA, COCCIÓN…"
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Técnica
            <input
              type="text"
              value={d.technique}
              onChange={(e) => setD({ ...d, technique: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Cantidad objetivo
            <input
              type="number"
              value={d.targetQuantity}
              onChange={(e) => setD({ ...d, targetQuantity: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Unidad
            <input
              type="text"
              value={d.unit}
              onChange={(e) => setD({ ...d, unit: e.target.value })}
              placeholder="KG, UD…"
              className={inputCls}
            />
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-800">Recurrencia</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-gray-600">
            Frecuencia *
            <select
              value={d.frequency}
              onChange={(e) => setD({ ...d, frequency: e.target.value as Frequency })}
              className={inputCls}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Hora planificada
            <input
              type="time"
              value={d.executionTime}
              onChange={(e) => setD({ ...d, executionTime: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Fecha inicio *
            <input
              type="date"
              value={d.startDate}
              onChange={(e) => setD({ ...d, startDate: e.target.value })}
              className={inputCls}
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Fecha fin (opcional)
            <input
              type="date"
              value={d.endDate}
              onChange={(e) => setD({ ...d, endDate: e.target.value })}
              className={inputCls}
            />
          </label>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Excluir días</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => toggleWeekday(w.value)}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                  d.excludeWeekdays.includes(w.value)
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <label className="block text-xs font-medium text-gray-600">
          Asignar por defecto a
          <select
            value={d.defaultAssigneeUserId}
            onChange={(e) => setD({ ...d, defaultAssigneeUserId: e.target.value })}
            className={inputCls}
          >
            <option value="">Sin asignar (se asigna luego)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? "—"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={d.isActive}
            onChange={(e) => setD({ ...d, isActive: e.target.checked })}
            className="rounded border-gray-300"
          />
          Ciclo activo
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/tasks/routines")}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !d.title.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
        >
          {isPending ? "Guardando..." : initialId ? "Guardar cambios" : "Crear ciclo"}
        </button>
      </div>
    </div>
  );
}
