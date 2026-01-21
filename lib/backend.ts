export function getBackendBaseUrl() {
  // Check for explicitly configured backend URL (highest priority)
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (configured && configured.length > 0) {
    // Ensure it ends with /api/v1 if it doesn't already
    const base = configured.trim();
    if (base.endsWith("/api/v1")) {
      return base;
    }
    return base.endsWith("/") ? `${base}api/v1` : `${base}/api/v1`;
  }

  // Production backend URL (default for production deployments)
  const productionUrl = "https://stellopay-backend-production.up.railway.app/api/v1";

  // Check if we're in production environment
  const isProduction = process.env.NODE_ENV === "production";

  // Check if we're on localhost (client-side check)
  if (typeof window !== "undefined" && window.location?.hostname) {
    const hostname = window.location.hostname;
    // If on localhost, use localhost backend
    if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
      return `http://${hostname}:4002/api/v1`;
  }
    // If not on localhost and in production, use production URL
    if (isProduction) {
      return productionUrl;
    }
  }

  // Server-side rendering: use production URL if in production, otherwise localhost
  if (isProduction) {
    return productionUrl;
  }
  
  // Development fallback
  return "http://localhost:4002/api/v1";
}

export async function apiGet<T>(path: string): Promise<T> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}${path}`, { method: "GET" });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error ?? `Request failed (${res.status})`);
  }
  return json as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = getBackendBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const errorMsg = json?.error ?? `Request failed (${res.status})`;
    // Provide more helpful message for session errors
    if (res.status === 401 && (errorMsg.toLowerCase().includes('invalid session') || errorMsg.toLowerCase().includes('session'))) {
      throw new Error("Session expired or invalid. Please reconnect and verify your wallet.");
    }
    throw new Error(errorMsg);
  }
  return json as T;
}

// Helper to process transaction events after a successful transaction
export async function processTransactionEvents(txHash: string): Promise<void> {
  try {
    const base = getBackendBaseUrl();
    await fetch(`${base}/events/process_tx/${txHash}`, {
      method: "POST",
    });
    // Silently fail - this is a background operation
  } catch (e) {
    console.warn("[events] Failed to process transaction events:", e);
  }
}




