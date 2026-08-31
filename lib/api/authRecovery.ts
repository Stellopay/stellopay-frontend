import { refreshToken as defaultRefreshToken } from "./auth";

/**
 * Custom error thrown when authorization tokens expire and recovery fails.
 */
export class AuthExpiredError extends Error {
  constructor(
    message: string = "Authorization token expired and cannot be recovered.",
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = "AuthExpiredError";
  }
}

export interface TokenState {
  accessToken?: string;
  csrfToken?: string;
}

export type AuthFailureListener = (error: AuthExpiredError) => void;
export type RefreshTokenHandler = () => Promise<TokenState>;

let currentTokens: TokenState = {};
let customRefreshHandler: RefreshTokenHandler | null = null;
let sharedRefreshPromise: Promise<TokenState> | null = null;
const authFailureListeners = new Set<AuthFailureListener>();

/**
 * Update active auth and CSRF tokens in memory.
 */
export function setTokens(tokens: TokenState): void {
  currentTokens = { ...currentTokens, ...tokens };
}

/**
 * Retrieve current in-memory auth and CSRF tokens.
 */
export function getTokens(): TokenState {
  return { ...currentTokens };
}

/**
 * Register a listener invoked when an unrecoverable auth failure occurs.
 */
export function setAuthFailureHandler(listener: AuthFailureListener): () => void {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

/**
 * Register a custom token refresh handler for testing or app override.
 */
export function setCustomRefreshHandler(handler: RefreshTokenHandler | null): void {
  customRefreshHandler = handler;
}

/**
 * Reset all internal state for testing or logout.
 */
export function resetRecoveryState(): void {
  currentTokens = {};
  customRefreshHandler = null;
  sharedRefreshPromise = null;
  authFailureListeners.clear();
}

/**
 * Helper to generate an idempotency key for safe mutation replay.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idempotency-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Executes a deduplicated token refresh attempt.
 * Multiple concurrent callers will receive the same shared Promise.
 * On failure, protected tokens are cleared and pending queue is rejected.
 */

export async function requestTokenRefresh(): Promise<TokenState> {
  if (sharedRefreshPromise) {
    return sharedRefreshPromise;
  }

  sharedRefreshPromise = (async () => {
    try {
      const newTokens = customRefreshHandler
        ? await customRefreshHandler()
        : await defaultRefreshToken();
      setTokens(newTokens);
      return newTokens;
    } catch (err) {
      // Clear protected tokens on unrecoverable refresh failure
      currentTokens = {};

      const authError =
        err instanceof AuthExpiredError
          ? err
          : new AuthExpiredError(
              err instanceof Error ? err.message : "Token refresh failed",
            );

      authFailureListeners.forEach((listener) => {
        try {
          listener(authError);
        } catch {
          // Ignore listener errors
        }
      });

      throw authError;
    } finally {
      sharedRefreshPromise = null;
    }
  })();

  return sharedRefreshPromise;
}

export interface AuthenticatedFetchOptions extends RequestInit {
  idempotencyKey?: string;
  _retry?: boolean;
}

/**
 * Enhanced `fetch` wrapper providing:
 * 1. Automatic token & CSRF header attachment
 * 2. Shared/deduplicated single refresh attempt on 401/403 expiry
 * 3. Non-recoverable failure handling without retry loops
 * 4. Idempotency header guard on state-changing mutations
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: AuthenticatedFetchOptions = {},
): Promise<Response> {
  const { idempotencyKey, _retry = false, headers: rawHeaders, method = "GET", ...restInit } = init;
  const upperMethod = method.toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(upperMethod);

  // Normalize headers
  const headers = new Headers(rawHeaders || {});

  // Attach auth and CSRF tokens if available
  if (currentTokens.accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${currentTokens.accessToken}`);
  }
  if (currentTokens.csrfToken && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", currentTokens.csrfToken);
  }

  // Idempotency guard for mutations
  let effectiveIdempotencyKey = idempotencyKey || headers.get("Idempotency-Key");
  if (isMutation) {
    if (!effectiveIdempotencyKey) {
      effectiveIdempotencyKey = generateIdempotencyKey();
    }
    headers.set("Idempotency-Key", effectiveIdempotencyKey);
  }

  const response = await fetch(input, {
    ...restInit,
    method: upperMethod,
    headers,
  });

  // Check for expired token / authorization failure
  const isAuthError = response.status === 401 || response.status === 403;

  if (!isAuthError) {
    return response;
  }

  // If already retried once, stop retrying to prevent loops
  if (_retry) {
    const error = new AuthExpiredError(
      "Non-recoverable authorization failure.",
      response.status,
    );
    authFailureListeners.forEach((listener) => {
      try {
        listener(error);
      } catch {
        // Ignore listener errors
      }
    });
    throw error;
  }

  // Attempt shared token refresh
  try {
    const newTokens = await requestTokenRefresh();

    // Prepare retried request with updated headers
    const retriedHeaders = new Headers(headers);
    if (newTokens.accessToken) {
      retriedHeaders.set("Authorization", `Bearer ${newTokens.accessToken}`);
    }
    if (newTokens.csrfToken) {
      retriedHeaders.set("X-CSRF-Token", newTokens.csrfToken);
    }
    if (isMutation && effectiveIdempotencyKey) {
      retriedHeaders.set("Idempotency-Key", effectiveIdempotencyKey);
    }

    return await authenticatedFetch(input, {
      ...restInit,
      method: upperMethod,
      headers: retriedHeaders,
      idempotencyKey: effectiveIdempotencyKey || undefined,
      _retry: true,
    });
  } catch (refreshErr) {
    if (refreshErr instanceof AuthExpiredError) {
      throw refreshErr;
    }
    const error = new AuthExpiredError(
      refreshErr instanceof Error ? refreshErr.message : "Session expired",
      response.status,
    );
    throw error;
  }
}
