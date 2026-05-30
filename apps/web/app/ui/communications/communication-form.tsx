"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  createCommunication,
  updateCommunication,
} from "@/app/lib/actions/communications";

type CommType = "BREAKDOWN" | "NOTICE" | "EVENT" | "MEETING" | "TASK" | "LIST";

const TYPE_OPTIONS: { value: CommType; label: string }[] = [
  { value: "BREAKDOWN", label: "Avería" },
  { value: "NOTICE", label: "Aviso" },
  { value: "EVENT", label: "Evento" },
  { value: "MEETING", label: "Reunión" },
  { value: "TASK", label: "Programada" },
  { value: "LIST", label: "Lista" },
];

type Initial = {
  id?: string;
  type: CommType;
  title: string;
  description: string;
  locationId: string;
  assigneeIds: string[];
  followerIds: string[];
  scheduledAt: string; // YYYY-MM-DDTHH:mm
  photoUrls: string[];
};

export default function CommunicationForm({
  locations,
  users,
  initial,
}: {
  locations: { id: string; name: string }[];
  users: { id: string; name: string }[];
  initial?: Initial;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [data, setData] = useState<Initial>(
    initial ?? {
      type: "NOTICE",
      title: "",
      description: "",
      locationId: locations[0]?.id ?? "",
      assigneeIds: [],
      followerIds: [],
      scheduledAt: "",
      photoUrls: [],
    },
  );

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "communications");
      const res = await fetch("/api/uploads/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData((d) => ({ ...d, photoUrls: [...d.photoUrls, json.url] }));
    } catch (e) {
      alert("Error subiendo: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    if (!data.title.trim()) {
      alert("Título obligatorio");
      return;
    }
    setBusy(true);
    startTransition(async () => {
      try {
        const payload = {
          type: data.type,
          title: data.title,
          description: data.description || undefined,
          locationId: data.locationId || null,
          assigneeIds: data.assigneeIds,
          followerIds: data.followerIds,
          scheduledAt: data.scheduledAt || null,
          photoUrls: data.photoUrls,
        };
        if (initial?.id) {
          await updateCommunication(initial.id, payload);
        } else {
          await createCommunication(payload);
        }
        router.push("/dashboard/communications");
      } catch (e) {
        alert("Error: " + (e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-gray-600">
            Tipo *
            <select
              value={data.type}
              onChange={(e) => setData({ ...data, type: e.target.value as CommType })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600">
            Local
            <select
              value={data.locationId}
              onChange={(e) => setData({ ...data, locationId: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Sin local (global)</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-xs font-medium text-gray-600">
          Título *
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            required
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>

        <label className="block text-xs font-medium text-gray-600">
          Descripción
          <textarea
            rows={3}
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          />
        </label>

        {data.type === "TASK" && (
          <label className="block text-xs font-medium text-gray-600">
            Programada para
            <input
              type="datetime-local"
              value={data.scheduledAt}
              onChange={(e) => setData({ ...data, scheduledAt: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
        )}

        {/* Fotos */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Fotos</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.photoUrls.map((url, i) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      photoUrls: data.photoUrls.filter((_, j) => j !== i),
                    })
                  }
                  className="absolute -top-1 -right-1 bg-white border border-gray-300 rounded-full p-0.5 shadow"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
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
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <CameraIcon className="w-4 h-4" />
            {uploading ? "Subiendo..." : "Añadir foto"}
          </button>
        </div>
      </div>

      <details className="bg-white border border-gray-200 rounded-lg p-4">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700">
          Asignados / Seguidores
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Asignados</p>
            <Chips
              options={users}
              value={data.assigneeIds}
              onChange={(v) => setData({ ...data, assigneeIds: v })}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Seguidores</p>
            <Chips
              options={users}
              value={data.followerIds}
              onChange={(v) => setData({ ...data, followerIds: v })}
            />
          </div>
        </div>
      </details>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/communications")}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {busy ? "Guardando..." : initial?.id ? "Guardar cambios" : "Crear"}
        </button>
      </div>
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  if (options.length === 0) {
    return <p className="text-xs text-gray-400 italic">No hay opciones</p>;
  }
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            className={
              active
                ? "px-3 py-1 text-xs font-medium rounded-full border bg-indigo-50 text-indigo-700 border-indigo-300"
                : "px-3 py-1 text-xs font-medium rounded-full border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}
