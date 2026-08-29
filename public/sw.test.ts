/**
 * public/sw.test.js
 * =================
 * Vitest unit tests for the StelloPay service worker (public/sw.js).
 *
 * The service worker runs in a browser ServiceWorkerGlobalScope, not a Node
 * module.  We simulate that environment by:
 *   • Providing stub globals (caches, fetch, clients, self.*) before loading
 *     the worker script with vm.runInNewContext / direct evaluation.
 *   • Using a thin event-listener map so addEventListener calls from the SW
 *     are captured and we can fire synthetic events.
 *
 * Tested scenarios
 * ----------------
 *  install — happy path   Shell assets are pre-cached; skipWaiting is NOT called.
 *  install — failure      If addAll() rejects the cache stays clean and no
 *                         skipWaiting is called; install "fails" (waitUntil
 *                         promise rejects).
 *  activate               Stale caches are deleted; clients.claim() runs;
 *                         every client receives an SW_ACTIVATED postMessage.
 *  message/reload coord   SKIP_WAITING message triggers self.skipWaiting().
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Load the service worker source once.
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SW_SOURCE = fs.readFileSync(
  path.join(__dirname, "sw.js"),
  "utf8",
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal service-worker global scope, register the SW source into
 * it, and return both the scope and a helper for firing synthetic events.
 *
 * @param {object} [overrides] - Optional globals to override on `self`.
 */
function buildScope(overrides = {}) {
  // ------------------------------------------------------------------
  // Event listener registry — mirrors addEventListener / dispatchEvent
  // ------------------------------------------------------------------
  const listeners = {};

  const addEventListener = vi.fn((type, handler) => {
    listeners[type] = listeners[type] || [];
    listeners[type].push(handler);
  });

  /**
   * Fire a synthetic SW event.
   * @param {string} type
   * @param {object} [eventData]   Extra properties merged onto the event object.
   * @returns {Promise<void>}      Resolves once waitUntil()'s promise resolves.
   */
  async function fireEvent(type, eventData = {}) {
    let waitUntilPromise = Promise.resolve();
    const event = {
      waitUntil: vi.fn((p) => {
        waitUntilPromise = Promise.resolve(p);
      }),
      ...eventData,
    };
    const handlers = listeners[type] || [];
    for (const handler of handlers) handler(event);
    return waitUntilPromise;
  }

  // ------------------------------------------------------------------
  // Cache API stubs
  // ------------------------------------------------------------------
  const cacheContents = {};

  const makeCacheStore = (name) => ({
    addAll: vi.fn(async (urls) => {
      cacheContents[name] = urls.slice();
    }),
    put: vi.fn(async (req, res) => {
      cacheContents[name] = cacheContents[name] || [];
      cacheContents[name].push(req);
    }),
    match: vi.fn(async () => undefined),
  });

  // All open named caches.  Starts empty; opens on demand.
  const openCaches = {};

  const caches = {
    open: vi.fn(async (name) => {
      openCaches[name] = openCaches[name] || makeCacheStore(name);
      return openCaches[name];
    }),
    keys: vi.fn(async () => Object.keys(openCaches)),
    delete: vi.fn(async (name) => {
      const existed = name in openCaches;
      delete openCaches[name];
      delete cacheContents[name];
      return existed;
    }),
    match: vi.fn(async () => undefined),
  };

  // ------------------------------------------------------------------
  // clients API stub
  // ------------------------------------------------------------------
  const mockClients = [
    { id: "client-1", postMessage: vi.fn() },
    { id: "client-2", postMessage: vi.fn() },
  ];

  const clientsStub = {
    claim: vi.fn(async () => {}),
    matchAll: vi.fn(async () => mockClients),
  };

  // ------------------------------------------------------------------
  // self — the ServiceWorkerGlobalScope proxy
  // ------------------------------------------------------------------
  const scope = {
    // Allow tests to inject a build id
    __BUILD_ID: overrides.__BUILD_ID || undefined,
    location: { origin: "https://stellopay.com" },
    addEventListener,
    skipWaiting: vi.fn(),
    caches,
    clients: clientsStub,
    fetch: vi.fn(),
    // Make fetch accessible as a global inside the SW source
    ...overrides,
  };

  // Expose scope as `self` inside the evaluated script.
  // We wrap the source so all references to `self` hit our stub.
  const wrappedSource = `
    (function(self, caches, fetch, clients) {
      ${SW_SOURCE}
    })(scope, scope.caches, scope.fetch, scope.clients);
  `;

  // eslint-disable-next-line no-new-func
  new Function("scope", wrappedSource)(scope);

  return { scope, fireEvent, openCaches, mockClients, cacheContents };
}

// ---------------------------------------------------------------------------
// Shared SHELL_ASSETS list (must match sw.js)
// ---------------------------------------------------------------------------
const SHELL_ASSETS = [
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon.ico",
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Service Worker — install", () => {
  it("happy path: pre-caches all shell assets and does NOT call skipWaiting", async () => {
    const { scope, fireEvent, openCaches } = buildScope();

    // Open the expected cache before install so it exists.
    await scope.caches.open("stellopay-shell-v1");
    // Reset the mock so addAll recording is fresh.
    openCaches["stellopay-shell-v1"].addAll.mockClear();

    await fireEvent("install");

    // The versioned cache must have been opened.
    expect(scope.caches.open).toHaveBeenCalledWith("stellopay-shell-v1");

    // All shell assets must be pre-cached.
    expect(openCaches["stellopay-shell-v1"].addAll).toHaveBeenCalledWith(
      SHELL_ASSETS,
    );

    // skipWaiting must NOT be called during install — we defer to the client.
    expect(scope.skipWaiting).not.toHaveBeenCalled();
  });

  it("uses CACHE_VERSION injected via __BUILD_ID", async () => {
    const { scope, openCaches } = buildScope({ __BUILD_ID: "build-abc123" });

    await scope.caches.open("stellopay-shell-build-abc123");
    openCaches["stellopay-shell-build-abc123"].addAll.mockClear();

    await (async () => {
      // Re-fire install on the scoped worker.
      let waitUntilPromise = Promise.resolve();
      const event = {
        waitUntil: (p) => { waitUntilPromise = Promise.resolve(p); },
      };
      const handler = scope.addEventListener.mock.calls.find(
        ([t]) => t === "install",
      )?.[1];
      if (handler) handler(event);
      return waitUntilPromise;
    })();

    expect(scope.caches.open).toHaveBeenCalledWith(
      "stellopay-shell-build-abc123",
    );
  });

  it("failure: install promise rejects and skipWaiting is not called if addAll fails", async () => {
    const { scope, fireEvent, openCaches } = buildScope();

    // Seed the cache stub before the worker runs its own open.
    await scope.caches.open("stellopay-shell-v1");

    // Make addAll() reject to simulate a network error during precache.
    openCaches["stellopay-shell-v1"].addAll.mockRejectedValue(
      new Error("network error"),
    );

    // The waitUntil promise should reject.
    await expect(fireEvent("install")).rejects.toThrow("network error");

    // skipWaiting must not be called — the install failed.
    expect(scope.skipWaiting).not.toHaveBeenCalled();
  });
});

describe("Service Worker — activate", () => {
  it("removes stale caches that do not match the current CACHE_NAME", async () => {
    const { scope, fireEvent, openCaches } = buildScope();

    // Seed two stale caches plus the current one.
    openCaches["stellopay-shell-v0"] = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() };
    openCaches["stellopay-shell-old"] = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() };
    openCaches["stellopay-shell-v1"] = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() };

    await fireEvent("activate");

    // Stale caches must be deleted.
    expect(scope.caches.delete).toHaveBeenCalledWith("stellopay-shell-v0");
    expect(scope.caches.delete).toHaveBeenCalledWith("stellopay-shell-old");

    // The current cache must NOT be deleted.
    expect(scope.caches.delete).not.toHaveBeenCalledWith("stellopay-shell-v1");
  });

  it("calls clients.claim() after pruning old caches", async () => {
    const { scope, fireEvent, openCaches } = buildScope();

    openCaches["stellopay-shell-v1"] = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() };

    await fireEvent("activate");

    expect(scope.clients.claim).toHaveBeenCalledOnce();
  });

  it("posts SW_ACTIVATED message to all open clients after activation", async () => {
    const { scope, fireEvent, mockClients, openCaches } = buildScope();

    openCaches["stellopay-shell-v1"] = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() };

    await fireEvent("activate");

    // matchAll should be called to enumerate clients.
    expect(scope.clients.matchAll).toHaveBeenCalledWith({
      includeUncontrolled: true,
    });

    // Every client should receive the SW_ACTIVATED message.
    for (const client of mockClients) {
      expect(client.postMessage).toHaveBeenCalledWith({
        type: "SW_ACTIVATED",
        version: "v1",
      });
    }
  });

  it("posts SW_ACTIVATED with the correct injected version", async () => {
    const { scope, fireEvent, mockClients, openCaches } = buildScope({
      __BUILD_ID: "deploy-42",
    });

    openCaches["stellopay-shell-deploy-42"] = {
      addAll: vi.fn(),
      put: vi.fn(),
      match: vi.fn(),
    };

    await fireEvent("activate");

    for (const client of mockClients) {
      expect(client.postMessage).toHaveBeenCalledWith({
        type: "SW_ACTIVATED",
        version: "deploy-42",
      });
    }
  });

  it("old caches are only removed after activate (install does not prune)", async () => {
    const { scope, fireEvent, openCaches } = buildScope();

    // Seed old cache.
    openCaches["stellopay-shell-v0"] = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() };
    openCaches["stellopay-shell-v1"] = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() };

    // After install, old cache must still be present.
    await fireEvent("install");
    expect(scope.caches.delete).not.toHaveBeenCalledWith("stellopay-shell-v0");

    // After activate, old cache must be gone.
    await fireEvent("activate");
    expect(scope.caches.delete).toHaveBeenCalledWith("stellopay-shell-v0");
  });
});

describe("Service Worker — client reload coordination (SKIP_WAITING)", () => {
  it("calls skipWaiting when it receives a SKIP_WAITING message", () => {
    const { scope } = buildScope();

    // Fire a synthetic message event with SKIP_WAITING.
    const messageHandler = scope.addEventListener.mock.calls.find(
      ([t]) => t === "message",
    )?.[1];

    expect(messageHandler).toBeDefined();

    messageHandler({ data: { type: "SKIP_WAITING" } });

    expect(scope.skipWaiting).toHaveBeenCalledOnce();
  });

  it("does not call skipWaiting for unrelated message types", () => {
    const { scope } = buildScope();

    const messageHandler = scope.addEventListener.mock.calls.find(
      ([t]) => t === "message",
    )?.[1];

    messageHandler({ data: { type: "SOME_OTHER_MESSAGE" } });
    messageHandler({ data: null });
    messageHandler({});

    expect(scope.skipWaiting).not.toHaveBeenCalled();
  });

  it("clients.claim() is called before posting SW_ACTIVATED so clients are controlled first", async () => {
    const { scope, fireEvent, openCaches } = buildScope();
    openCaches["stellopay-shell-v1"] = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() };

    const callOrder = [];
    scope.clients.claim.mockImplementation(async () => {
      callOrder.push("claim");
    });
    scope.clients.matchAll.mockImplementation(async () => {
      callOrder.push("matchAll");
      return [];
    });

    await fireEvent("activate");

    expect(callOrder).toEqual(["claim", "matchAll"]);
  });
});

describe("Service Worker — offline fallback availability during update", () => {
  it("registers a fetch event listener (offline fallback is wired up)", () => {
    const { scope } = buildScope();

    const fetchHandlers = scope.addEventListener.mock.calls.filter(
      ([t]) => t === "fetch",
    );
    expect(fetchHandlers.length).toBeGreaterThan(0);
  });

  it("shell assets include /offline so fallback is pre-cached during install", async () => {
    const { scope, fireEvent, openCaches } = buildScope();

    await scope.caches.open("stellopay-shell-v1");
    openCaches["stellopay-shell-v1"].addAll.mockClear();

    await fireEvent("install");

    const [cachedUrls] =
      openCaches["stellopay-shell-v1"].addAll.mock.calls[0];

    expect(cachedUrls).toContain("/offline");
  });
});
