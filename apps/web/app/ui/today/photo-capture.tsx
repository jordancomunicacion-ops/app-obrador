"use client";

import { useRef, useState } from "react";
import { CameraIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function PhotoCapture({
  value,
  onChange,
  required,
  prefix = "responses",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
  prefix?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", prefix);
      const res = await fetch("/api/uploads/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      onChange(json.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="relative inline-block">
        <img
          src={value}
          alt="Evidencia"
          className="w-32 h-32 object-cover rounded-xl border border-gray-200"
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow-sm hover:bg-gray-50"
          aria-label="Quitar foto"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
          required
            ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        } disabled:opacity-50`}
      >
        {uploading ? (
          <>Subiendo...</>
        ) : (
          <>
            <CameraIcon className="w-5 h-5" />
            {required ? "Foto obligatoria" : "Añadir foto"}
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
