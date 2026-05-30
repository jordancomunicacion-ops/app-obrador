"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { addComment } from "@/app/lib/actions/communications";

export default function CommentComposer({ communicationId }: { communicationId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "communications/comments");
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

  function handleSend() {
    if (!body.trim() && photos.length === 0) return;
    setSending(true);
    startTransition(async () => {
      try {
        await addComment(communicationId, body, photos);
        setBody("");
        setPhotos([]);
        router.refresh();
      } catch (e) {
        alert("Error: " + (e as Error).message);
      } finally {
        setSending(false);
      }
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {photos.map((url, i) => (
            <div key={url} className="relative">
              <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
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
      <textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escribe un comentario..."
        className="w-full border-0 px-2 py-1 text-sm focus:outline-none resize-none"
      />
      <div className="flex items-center justify-between">
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
          className="text-xs text-gray-500 hover:text-indigo-600 inline-flex items-center gap-1"
        >
          <CameraIcon className="w-4 h-4" />
          {uploading ? "Subiendo..." : "Foto"}
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || (!body.trim() && photos.length === 0)}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          {sending ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
