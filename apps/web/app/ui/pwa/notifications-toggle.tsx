"use client";

import { useEffect, useState } from "react";
import { BellAlertIcon, BellSlashIcon } from "@heroicons/react/24/outline";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function NotificationsToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<"unsupported" | "denied" | "off" | "on" | "loading">(
    "loading",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "on" : "off");
      } catch {
        setState("off");
      }
    })();
  }, []);

  async function enable() {
    if (!publicKey) {
      alert("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY en el servidor");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("on");
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "unsupported") return null;
  if (state === "denied") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 px-2 py-1 rounded-lg border border-gray-200"
        title="Permite las notificaciones en los ajustes del navegador"
      >
        <BellSlashIcon className="w-4 h-4" />
        Notif. bloqueadas
      </span>
    );
  }

  if (state === "on") {
    return (
      <button
        type="button"
        onClick={disable}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        title="Pulsa para desactivar"
      >
        <BellAlertIcon className="w-4 h-4" />
        Notif. activas
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    >
      <BellAlertIcon className="w-4 h-4" />
      {busy ? "..." : "Activar notificaciones"}
    </button>
  );
}
