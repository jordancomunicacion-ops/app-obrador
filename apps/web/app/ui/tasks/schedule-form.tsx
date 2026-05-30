"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { createSchedule, updateSchedule } from "@/app/lib/actions/checklist-schedules";

type Frequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "ANNUAL";

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

type Initial = {
  id?: string;
  templateId: string;
  locationId: string;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  executionStartTime: string;
  executionEndTime: string;
  excludeWeekdays: number[];
  autoClose: boolean;
  pinned: boolean;
  performerUserIds: string[];
  supervisorUserIds: string[];
  followerUserIds: string[];
  performerRoles: string[];
  supervisorRoles: string[];
  followerRoles: string[];
};

export default function ScheduleForm({
  templates,
  locations,
  users,
  availableRoles,
  initial,
}: {
  templates: { id: string; name: string; locationId: string | null }[];
  locations: { id: string; name: string }[];
  users: { id: string; name: string }[];
  availableRoles: string[];
  initial?: Initial;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [data, setData] = useState<Initial>(
    initial ?? {
      templateId: templates[0]?.id ?? "",
      locationId: locations[0]?.id ?? "",
      frequency: "DAILY",
      startDate: today,
      endDate: "",
      executionStartTime: "08:00",
      executionEndTime: "12:00",
      excludeWeekdays: [],
      autoClose: false,
      pinned: false,
      performerUserIds: [],
      supervisorUserIds: [],
      followerUserIds: [],
      performerRoles: [],
      supervisorRoles: [],
      followerRoles: [],
    },
  );

  const [openSections, setOpenSections] = useState({
    basic: true,
    performers: false,
    supervisors: false,
    advanced: false,
  });

  function toggleSection(k: keyof typeof openSections) {
    setOpenSections((s) => ({ ...s, [k]: !s[k] }));
  }

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  async function handleSubmit() {
    const payload = {
      ...data,
      endDate: data.endDate || null,
    };
    startTransition(async () => {
      try {
        if (initial?.id) {
          await updateSchedule(initial.id, payload);
          router.push("/dashboard/tasks/schedules");
        } else {
          await createSchedule(payload);
        }
      } catch (e) {
        alert("Error: " + (e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {/* SECCIÓN 1: Información básica */}
      <Section
        title="Información básica"
        open={openSections.basic}
        onToggle={() => toggleSection("basic")}
        required
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Plantilla" required>
            <select
              value={data.templateId}
              onChange={(e) => setData({ ...data, templateId: e.target.value })}
              className="input"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Local" required>
            <select
              value={data.locationId}
              onChange={(e) => setData({ ...data, locationId: e.target.value })}
              className="input"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Frecuencia" required>
            <select
              value={data.frequency}
              onChange={(e) => setData({ ...data, frequency: e.target.value as Frequency })}
              className="input"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <div />
          <Field label="Fecha inicio" required>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => setData({ ...data, startDate: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Fecha fin">
            <input
              type="date"
              value={data.endDate}
              onChange={(e) => setData({ ...data, endDate: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Hora ejecución inicio" required>
            <input
              type="time"
              value={data.executionStartTime}
              onChange={(e) => setData({ ...data, executionStartTime: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Hora ejecución fin" required>
            <input
              type="time"
              value={data.executionEndTime}
              onChange={(e) => setData({ ...data, executionEndTime: e.target.value })}
              className="input"
            />
          </Field>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Excluir días</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    excludeWeekdays: toggleArrayItem(data.excludeWeekdays, d.value),
                  })
                }
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                  data.excludeWeekdays.includes(d.value)
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.autoClose}
              onChange={(e) => setData({ ...data, autoClose: e.target.checked })}
            />
            Cierre automático al pasar la hora fin
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.pinned}
              onChange={(e) => setData({ ...data, pinned: e.target.checked })}
            />
            Fijar arriba en el listado de la app móvil
          </label>
        </div>
      </Section>

      {/* SECCIÓN 2: Ejecutores */}
      <Section
        title="Personas que realizarán el checklist"
        open={openSections.performers}
        onToggle={() => toggleSection("performers")}
      >
        <p className="text-xs text-gray-500 mb-2">Selecciona empleados concretos o roles.</p>
        <Field label="Empleados">
          <MultiSelect
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            value={data.performerUserIds}
            onChange={(v) => setData({ ...data, performerUserIds: v })}
          />
        </Field>
        <Field label="Roles">
          <MultiSelect
            options={availableRoles.map((r) => ({ value: r, label: r }))}
            value={data.performerRoles}
            onChange={(v) => setData({ ...data, performerRoles: v })}
          />
        </Field>
      </Section>

      {/* SECCIÓN 3: Supervisores */}
      <Section
        title="Personas que supervisarán el checklist"
        open={openSections.supervisors}
        onToggle={() => toggleSection("supervisors")}
      >
        <Field label="Empleados">
          <MultiSelect
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            value={data.supervisorUserIds}
            onChange={(v) => setData({ ...data, supervisorUserIds: v })}
          />
        </Field>
        <Field label="Roles">
          <MultiSelect
            options={availableRoles.map((r) => ({ value: r, label: r }))}
            value={data.supervisorRoles}
            onChange={(v) => setData({ ...data, supervisorRoles: v })}
          />
        </Field>
      </Section>

      {/* SECCIÓN 4: Avanzadas (seguidores) */}
      <Section
        title="Opciones avanzadas"
        open={openSections.advanced}
        onToggle={() => toggleSection("advanced")}
      >
        <p className="text-xs text-gray-500 mb-2">
          Los seguidores solo leen las respuestas, no ejecutan ni supervisan.
        </p>
        <Field label="Seguidores (empleados)">
          <MultiSelect
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            value={data.followerUserIds}
            onChange={(v) => setData({ ...data, followerUserIds: v })}
          />
        </Field>
        <Field label="Seguidores por rol">
          <MultiSelect
            options={availableRoles.map((r) => ({ value: r, label: r }))}
            value={data.followerRoles}
            onChange={(v) => setData({ ...data, followerRoles: v })}
          />
        </Field>
      </Section>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/tasks/schedules")}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !data.templateId || !data.locationId}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {isPending ? "Guardando..." : initial?.id ? "Guardar cambios" : "Crear programación"}
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          outline: none;
          box-shadow: 0 0 0 2px rgb(99 102 241 / 0.5);
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  open,
  onToggle,
  required,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        <ChevronDownIcon
          className={clsx("w-4 h-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  if (options.length === 0) {
    return <p className="text-xs text-gray-400 italic">No hay opciones</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() =>
              onChange(active ? value.filter((v) => v !== o.value) : [...value, o.value])
            }
            className={clsx(
              "px-3 py-1 text-xs font-medium rounded-full border transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
