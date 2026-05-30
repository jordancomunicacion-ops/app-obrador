/* Service Worker — App Cocina SOTOdelPRIOR */
const CACHE_NAME = "cocina-v1";
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
