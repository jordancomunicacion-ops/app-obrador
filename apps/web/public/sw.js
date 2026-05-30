/* Service Worker — App Cocina SOTOdelPRIOR */
const CACHE_NAME = "cocina-v2";
const STATIC_ASSETS = [
  "/",
  "/dashboard/today",
  "/logo-icon.png",
  "/logo-full.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// ============================================================================
// Push notifications
// ============================================================================
self.addEventListener("push", (event) => {
  let data = { title: "Cocina", body: "Tienes una notificación nueva", url: "/dashboard/today" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  const options = {
    body: data.body,
    icon: data.icon || "/logo-icon.png",
    badge: "/logo-icon.png",
    tag: data.tag,
    data: { url: data.url || "/dashboard/today" },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/dashboard/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // No interceptar peticiones a la API ni a Spaces (queremos siempre data fresca)
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("digitaloceanspaces.com") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  // Network-first con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || new Response("Offline", { status: 503 }))),
  );
});
