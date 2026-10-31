const CACHE_NAME = "jaf-admin-pwa-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Always network-first so Next.js HMR, CSS, JS, and live admin data are never stale
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  );
});
