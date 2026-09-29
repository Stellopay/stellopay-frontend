/**
 * @fileoverview Profile API client.
 *
 * Issues real requests against the configured API base URL
 * (`NEXT_PUBLIC_API_BASE_URL`) and validates every response at the boundary
 * (see `parseProfile`) before any consumer is allowed to use it.
 *
 * ## Why the result is a tagged union
 *
 * The backend profile endpoint may not exist yet. This module used to return a
 * hardcoded object from a function typed exactly like a real client, so every
 * screen rendered placeholder data with no loading state, no error state, and
 * no type-level signal that the data was fake. Now the placeholder is explicit:
 * {@link getProfile} returns `source: "api"` or `source: "placeholder"`, so a
 * consumer cannot render seeded data without narrowing on the discriminant and
 * surfacing it to the user.
 *
 * Exported as a separate module so tests can mock it cleanly with `vi.mock`.
 */

import { DEMO_PROFILE } from "@/lib/demo-data";
import type { ProfileData, ProfileResult } from "@/types/profile";
import { parseProfile } from "./response-validation";

/** Path of the profile endpoint, relative to the configured API base URL. */
export const PROFILE_ENDPOINT_PATH = "/api/user/profile";

/**
 * How long a single profile request may take before it is aborted.
 * Without this a hung request would leave the consumer stuck in its loading
 * state forever, since a `fetch()` that never settles never rejects either.
 */
export const PROFILE_REQUEST_TIMEOUT_MS = 10_000;

/** Latency simulated on the placeholder path so loading states stay visible. */
const PLACEHOLDER_LATENCY_MS = 400;

/**
 * A recoverable profile failure. Consumers branch on `code` to decide between
 * "retry", "sign in again", and "this will never work".
 */
export type ProfileErrorCode =
  | "network"
  | "http"
  | "invalid_response"
  | "timeout";

export class ProfileApiError extends Error {
  readonly code: ProfileErrorCode;
  /** HTTP status, present only when `code === "http"`. */
  readonly status?: number;

  constructor(
    message: string,
    code: ProfileErrorCode,
    status?: number,
  ) {
    super(message);
    this.name = "ProfileApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * The configured API base URL, normalised without a trailing slash, or `null`
 * when the backend has not been configured yet.
 *
 * Reading this through a function (rather than a module constant) keeps the
 * value live for tests, which use `vi.stubEnv`.
 */
export function getApiBaseUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) return null;
  return configured.replace(/\/+$/, "");
}

/**
 * Whether the real profile endpoint is reachable.
 *
 * When this is `false` the client deliberately serves seeded demo data instead
 * of pretending to be a working client — see {@link getProfile}.
 */
export function isProfileEndpointConfigured(): boolean {
  return getApiBaseUrl() !== null;
}

/** Human-readable explanation shown next to the placeholder badge. */
export const PROFILE_PLACEHOLDER_MESSAGES = {
  api_base_url_missing:
    "Showing demo profile data — the profile API is not configured yet.",
} as const;

/** A fresh copy of the seeded demo profile. */
function buildPlaceholderProfile(): ProfileData {
  return {
    firstName: DEMO_PROFILE.firstName,
    lastName: DEMO_PROFILE.lastName,
    displayName: DEMO_PROFILE.displayName,
    email: DEMO_PROFILE.email,
    timezone: DEMO_PROFILE.timezone,
    currency: DEMO_PROFILE.currency,
    legalEntity: DEMO_PROFILE.legalEntity,
    billingCountry: DEMO_PROFILE.billingCountry,
  };
}

/** Resolves after `ms`, rejecting early if `signal` aborts. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

/**
 * Performs the request and returns the decoded JSON body.
 *
 * Every failure mode is normalised to a {@link ProfileApiError} so callers
 * never have to distinguish `TypeError` from `SyntaxError` from a bare
 * non-`ok` response. An abort triggered by the *caller* propagates as a
 * `DOMException` named `"AbortError"`; an abort triggered by our own timeout
 * becomes a `timeout` ProfileApiError instead.
 */
async function requestJson(
  url: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PROFILE_REQUEST_TIMEOUT_MS);

  const onCallerAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onCallerAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { Accept: "application/json", ...init.headers },
    });

    if (!response.ok) {
      throw new ProfileApiError(
        `Profile request failed with status ${response.status}.`,
        "http",
        response.status,
      );
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new ProfileApiError(
        "Profile request returned a body that was not valid JSON.",
        "invalid_response",
      );
    }
  } catch (error) {
    if (error instanceof ProfileApiError) throw error;

    // Our own timeout aborted the request; report it as such rather than
    // letting it masquerade as a caller cancellation or a network fault.
    if (timedOut) {
      throw new ProfileApiError(
        "Profile request timed out. Please try again.",
        "timeout",
      );
    }

    // A caller-driven abort is a normal part of the lifecycle, not a failure.
    if (signal?.aborted || (error as Error)?.name === "AbortError") {
      throw error;
    }

    throw new ProfileApiError(
      "Could not reach the profile service. Check your connection and try again.",
      "network",
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onCallerAbort);
  }
}

/**
 * Load the signed-in user's profile.
 *
 * Issues a `GET` against `${NEXT_PUBLIC_API_BASE_URL}/api/user/profile` and
 * validates the payload at the boundary before returning it.
 *
 * When no API base URL is configured the backend genuinely does not exist yet,
 * so instead of silently returning a hardcoded object the client resolves to an
 * explicitly flagged placeholder result (`source: "placeholder"`) that the
 * caller is expected to surface in the UI.
 *
 * @throws {ProfileApiError} On network failure, non-2xx response, malformed
 *   JSON, or timeout.
 * @throws {DOMException} With `.name === "AbortError"` when `signal` aborts.
 */
export async function getProfile(
  signal?: AbortSignal,
): Promise<ProfileResult> {
  const baseUrl = getApiBaseUrl();

  if (baseUrl === null) {
    await delay(PLACEHOLDER_LATENCY_MS, signal);
    return {
      source: "placeholder",
      profile: buildPlaceholderProfile(),
      reason: "api_base_url_missing",
    };
  }

  const json = await requestJson(
    `${baseUrl}${PROFILE_ENDPOINT_PATH}`,
    { method: "GET" },
    signal,
  );

  return { source: "api", profile: parseProfile(json) };
}

/** Outcome of a save, tagged so callers cannot mistake staging for a write. */
export type ProfileSaveResult =
  | { source: "api"; saved: ProfileData }
  | { source: "placeholder"; staged: ProfileData };

/**
 * Persist the profile to the server.
 *
 * Issues a `PUT` against `${NEXT_PUBLIC_API_BASE_URL}/api/user/profile`. The
 * outgoing payload is validated at the boundary first, so a component bug that
 * sends a malformed profile is rejected locally instead of being written.
 *
 * When the API is not configured there is nowhere to persist to, so the call
 * resolves to `source: "placeholder"` — the caller is expected to tell the
 * user the change was only staged rather than claiming it was saved.
 *
 * @throws {ProfileApiError} When the profile is malformed, the request fails,
 *   or the server rejects it.
 */
export async function saveProfile(
  profile: ProfileData,
): Promise<ProfileSaveResult> {
  const baseUrl = getApiBaseUrl();

  // Validate before sending: an invalid payload would be rejected by the
  // server anyway, and failing locally keeps the error message specific.
  const validated = parseProfile(profile);

  if (baseUrl === null) {
    await delay(PLACEHOLDER_LATENCY_MS);
    return { source: "placeholder", staged: validated };
  }

  await requestJson(`${baseUrl}${PROFILE_ENDPOINT_PATH}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validated),
  });

  return { source: "api", saved: validated };
}
