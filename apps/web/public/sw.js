/**
 * OpenSprout Service Worker — v0.9.14
 *
 * Strategy: Network-first with cache fallback.
 * Cache is versioned by CACHE_NAME — change on deploy to invalidate.
 */

const CACHE_NAME = "opensprout-v0.9.14";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Message: handle skip-waiting for update notification ────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Install: cache app shell ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: clean old caches, claim all clients ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: network-first, cache fallback ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip non-http(s) requests (e.g., chrome-extension://)
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for future offline use
        if (response.ok || response.type === "opaqueredirect") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Don't cache responses from external origins (Supabase, PlantNet)
            if (event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, copy);
            }
          });
        }
        return response;
      })
      .catch(() => {
        // Offline — try cache, fall back to root
        return caches
          .match(event.request)
          .then((cached) => cached || caches.match("/"));
      }),
  );
});
