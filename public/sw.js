/**
 * StelloPay — Minimal App Shell Service Worker
 * ============================================
 * Strategy: Cache-first for the app shell (static assets, fonts, icons).
 *           Network-first for navigation requests, falling back to an offline
 *           page when the network is unavailable.
 *
 * Cache invalidation
 * ------------------
 * CACHE_NAME is versioned with a deploy-time stamp.  Bumping this value (or
 * setting NEXT_PUBLIC_SW_VERSION in your CI environment) causes the activate
 * step to delete every previous cache so users always receive a fresh shell
 * after a deploy.  The recommended approach is to inject the build ID here
 * during your CI pipeline:
 *
 *   // next.config.ts  — replace the static string with process.env.BUILD_ID
 *   headers: [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] }]
 *
 * See README.md → "Service Worker & Offline Support" for the full strategy.
 */

const CACHE_VERSION = "v1"; // ← bump this (or inject BUILD_ID) on every deploy
const CACHE_NAME = `stellopay-shell-${CACHE_VERSION}`;

/**
 * App-shell assets to pre-cache on install.
 * Keep this list lean — only the resources required to render the navigation
 * chrome and the offline fallback without any network round-trips.
 */
const SHELL_ASSETS = [
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon.ico",
];

// ---------------------------------------------------------------------------
// Install — pre-cache the app shell
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      // Activate immediately instead of waiting for old tabs to close.
      .then(() => self.skipWaiting()),
  );
});

// ---------------------------------------------------------------------------
// Activate — prune stale caches from previous versions
// ---------------------------------------------------------------------------
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
      // Take control of all open clients without requiring a page reload.
      .then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Fetch — routing logic
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin requests.  Let cross-origin requests (CDN
  // assets, analytics, API calls to external hosts) pass through unmodified.
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests — POST/PUT/DELETE must always hit the network.
  if (request.method !== "GET") return;

  // Skip Next.js internal routes (_next/webpack-hmr, __nextjs_*).
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;
  if (url.pathname.startsWith("/__nextjs")) return;

  // ------------------------------------------------------------------
  // Static assets (_next/static/**) — cache-first
  // These filenames are content-hashed by Next.js so they are safe to
  // cache indefinitely.  A new deploy produces new hashes and a new
  // CACHE_NAME already purges the old entries.
  // ------------------------------------------------------------------
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ------------------------------------------------------------------
  // Navigation requests (HTML documents) — network-first, offline fallback
  // ------------------------------------------------------------------
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // ------------------------------------------------------------------
  // Everything else — stale-while-revalidate (images, fonts, api)
  // ------------------------------------------------------------------
  event.respondWith(staleWhileRevalidate(request));
});

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

/**
 * Cache-first: serve from cache immediately; fall back to network when the
 * entry is absent.  Newly fetched responses are added to the cache.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network-first for HTML navigation: try the network; if offline (or the
 * server returns a non-2xx), serve the pre-cached /offline page instead of
 * letting the browser display its default "No internet" error.
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    // Cache successful navigation responses so we have a fresh copy next time.
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed — serve from cache if we have it, else show /offline.
    const cached = await caches.match(request);
    if (cached) return cached;

    const offlinePage = await caches.match("/offline");
    if (offlinePage) return offlinePage;

    // Last-resort: return a minimal inline response so the browser never
    // displays its raw "connection error" page.
    return new Response(
      "<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Offline — StelloPay</title></head><body><p>You are offline. Please check your connection.</p></body></html>",
      { headers: { "Content-Type": "text/html;charset=utf-8" } },
    );
  }
}

/**
 * Stale-while-revalidate: serve from cache immediately (if present) and
 * simultaneously revalidate in the background.  Falls back to network when
 * there is no cached copy.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached); // if network fails, return whatever we have

  return cached ?? fetchPromise;
}
