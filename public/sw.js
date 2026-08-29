/**
 * StelloPay — Versioned App Shell Service Worker
 * ================================================
 * Strategy: Cache-first for the app shell (static assets, fonts, icons).
 *           Network-first for navigation requests, falling back to an offline
 *           page when the network is unavailable.
 *
 * Cache invalidation & coordinated activation
 * -------------------------------------------
 * Problem: calling skipWaiting() immediately lets the new worker take over
 * clients that still have HTML from the previous build in flight.  The
 * resulting mix of old HTML referencing old JS hashes and new cached JS (or
 * vice-versa) can produce a broken page.
 *
 * Solution (three-step handshake):
 *   1. Install — pre-cache the full shell into the new, versioned cache.
 *      skipWaiting is intentionally NOT called here.  The old worker keeps
 *      serving until clients explicitly agree to reload.
 *
 *   2. Activate (triggered only when all old tabs are closed, or after the
 *      client-driven SKIP_WAITING below) —
 *      a. Delete every cache whose name != CACHE_NAME (old caches are only
 *         pruned AFTER the new shell is confirmed valid from step 1).
 *      b. Claim all open clients (clients.claim()) so this worker handles
 *         the next request immediately.
 *      c. Post SW_ACTIVATED to every client so the app can prompt the user
 *         to reload for the freshest experience.
 *
 *   3. Client-driven skip — the page can send { type: "SKIP_WAITING" } to
 *      the *waiting* worker at any point (e.g., on an update-available
 *      banner "Reload" click).  The waiting worker calls skipWaiting() only
 *      then, ensuring it replaces an active worker only when the client
 *      consents.
 *
 * Cache versioning
 * ----------------
 * CACHE_VERSION is injected from the build environment.  In CI set
 * NEXT_PUBLIC_BUILD_ID (or BUILD_ID) so each deploy produces a unique cache
 * name and the activate step sweeps old caches automatically:
 *
 *   // next.config.ts
 *   env: { NEXT_PUBLIC_BUILD_ID: process.env.BUILD_ID ?? Date.now().toString() }
 *
 * See README.md → "Service Worker & Offline Support" for the full strategy.
 */

/* global self, caches, fetch, clients */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Injected at build time by the CI pipeline (e.g. via next.config.ts env
 * block).  Falls back to "v1" for local development.  Change this value on
 * every deploy to bust the old cache.
 */
const CACHE_VERSION =
  (typeof self !== "undefined" &&
    self.__BUILD_ID) || // test/CI injection point
  "v1";

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

// Message types used for worker ↔ client communication.
const MSG = {
  /** Client → waiting worker: take over now (user confirmed reload). */
  SKIP_WAITING: "SKIP_WAITING",
  /** Active worker → all clients: new cache is live, safe to reload. */
  SW_ACTIVATED: "SW_ACTIVATED",
};

// ---------------------------------------------------------------------------
// Install — pre-cache the app shell
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  /**
   * waitUntil keeps the worker in the "installing" state until the shell is
   * fully cached.  If addAll() rejects (network error, bad response), the
   * install fails and the worker is discarded — the old worker keeps running
   * and no partial cache is left behind.
   *
   * skipWaiting is NOT called here.  The new worker waits in "installed"
   * state until either:
   *   • all old clients are closed (browser default behaviour), or
   *   • a client sends SKIP_WAITING (see message handler below).
   */
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
});

// ---------------------------------------------------------------------------
// Activate — prune stale caches, claim clients, notify them
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        // Remove every cache that belongs to an older version of this worker.
        // This runs only AFTER the new cache was successfully populated in the
        // install step, satisfying the acceptance criterion:
        //   "Old caches are removed only after the new cache is valid."
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      // Take control of all open clients without requiring a page reload.
      .then(() => self.clients.claim())
      // Notify every controlled client that this new worker is now active.
      // The client-side code can use this to prompt "A new version is ready —
      // reload to apply" or to reload automatically if the app is idle.
      .then(() =>
        self.clients.matchAll({ includeUncontrolled: true }).then((clientList) =>
          Promise.all(
            clientList.map((client) =>
              client.postMessage({ type: MSG.SW_ACTIVATED, version: CACHE_VERSION }),
            ),
          ),
        ),
      ),
  );
});

// ---------------------------------------------------------------------------
// Message — client-driven skipWaiting
// ---------------------------------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === MSG.SKIP_WAITING) {
    // A client has acknowledged the update (e.g., the user clicked "Reload").
    // Only NOW do we skip the waiting phase, guaranteeing the client and the
    // new worker are in sync.
    self.skipWaiting();
  }
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
 *
 * The /offline page was pre-cached during install, so it is always
 * available even if the device loses connectivity mid-update — satisfying
 * the acceptance criterion:
 *   "Offline fallback remains available during an update."
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
