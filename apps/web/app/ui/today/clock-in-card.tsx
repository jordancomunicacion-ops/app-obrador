"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  CameraIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { clockIn, clockOut } from "@/app/lib/actions/clock-in";

type Initial = {
  id: string;
  startAt: string; // ISO
  locationName: string | null;
} | null;

export default function ClockInCard({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!initial) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [initial]);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "clock-in");
      const res = await fetch("/api/uploads/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setPhotoUrl(json.url);
    } catch (e) {
      alert("Error subiendo foto: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleClockIn() {
    setBusy(true);
    startTransition(async () => {
      try {
        await clockIn({ photoUrl });
        setPhotoUrl(null);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  function handleClockOut() {
    if (!confirm("¿Fichar salida?")) return;
    setBusy(true);
    startTransition(async () => {
      try {
        await clockOut({ photoUrl });
        setPhotoUrl(null);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  if (initial) {
    const ms = now - new Date(initial.startAt).getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return (
      <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-emerald-800">
            <ClockIcon className="w-5 h-5" />
            <span className="font-semibold">Trabajando</span>
          </div>
          <Link
            href="/dashboard/today/clock-in"
            className="text-xs text-emerald-700 hover:underline"
          >
            Historial →
          </Link>
        </div>
        <p className="text-3xl font-bold text-emerald-900 font-mono tabular-nums">
          {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </p>
        <p className="text-xs text-emerald-700 mt-1">
          Entrada a las {new Date(initial.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          {initial.locationName && ` · ${initial.locationName}`}
        </p>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
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
            className="text-xs px-3 py-1.5 border border-emerald-300 bg-white rounded-lg hover:bg-emerald-50 inline-flex items-center gap-1"
          >
            <CameraIcon className="w-3.5 h-3.5" />
            {uploading ? "..." : photoUrl ? "Foto lista ✓" : "Foto opcional"}
          </button>
          <button
            type="button"
            onClick={handleClockOut}
            disabled={busy}
            className="ml-auto bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            {busy ? "..." : "Fichar salida"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-700">
          <ClockIcon className="w-5 h-5" />
          <span className="font-semibold">Fichaje</span>
        </div>
        <Link href="/dashboard/today/clock-in" className="text-xs text-gray-500 hover:underline">
          Historial →
        </Link>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
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
          {uploading ? "..." : photoUrl ? "Foto lista ✓" : "Foto opcional"}
        </button>
        <button
          type="button"
          onClick={handleClockIn}
          disabled={busy}
          className="ml-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          {busy ? "..." : "Fichar entrada"}
        </button>
      </div>
    </div>
  );
}
