import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getProfile,
  isProfileEndpointConfigured,
  PROFILE_ENDPOINT_PATH,
  PROFILE_REQUEST_TIMEOUT_MS,
  ProfileApiError,
  saveProfile,
} from "./profile";
import { ApiResponseValidationError } from "./response-validation";
import type { ProfileData } from "@/types/profile";

const API_BASE = "https://api.stellopay.test";
const PROFILE_URL = `${API_BASE}${PROFILE_ENDPOINT_PATH}`;

const VALID_PROFILE: ProfileData = {
  firstName: "Ada",
  lastName: "Lovelace",
  displayName: "Ada Lovelace",
  email: "ada@stellopay.test",
  timezone: "Europe/London",
  currency: "GBP",
  legalEntity: "Analytical Engines Ltd",
  billingCountry: "United Kingdom",
};

/** Build a `Response`-like object good enough for the client's usage. */
function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = init;
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

/** A promise plus its resolver, for driving slow-response paths. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("profile client — configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports the endpoint as unconfigured when no API base URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    expect(isProfileEndpointConfigured()).toBe(false);
  });

  it("reports the endpoint as configured when an API base URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", `${API_BASE}/`);
    expect(isProfileEndpointConfigured()).toBe(true);
  });
});

describe("getProfile — success path", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("issues a real GET against the configured API base URL", async () => {
    fetchMock.mockResolvedValue(jsonResponse(VALID_PROFILE));

    await getProfile();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(PROFILE_URL);
    expect(init.method).toBe("GET");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns the profile tagged with an api source", async () => {
    fetchMock.mockResolvedValue(jsonResponse(VALID_PROFILE));

    const result = await getProfile();

    expect(result.source).toBe("api");
    expect(result.profile).toMatchObject({
      firstName: "Ada",
      email: "ada@stellopay.test",
    });
  });

  it("drops unknown fields the API may add later", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ...VALID_PROFILE, internalRiskScore: 42 }),
    );

    const result = await getProfile();

    expect(result.source).toBe("api");
    expect(result.profile).not.toHaveProperty("internalRiskScore");
  });
});

describe("getProfile — empty path", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("accepts a profile whose fields are all blank strings", async () => {
    const emptyProfile = Object.fromEntries(
      Object.keys(VALID_PROFILE).map((key) => [key, ""]),
    ) as ProfileData;
    fetchMock.mockResolvedValue(jsonResponse(emptyProfile));

    const result = await getProfile();

    expect(result.source).toBe("api");
    expect(result.profile.firstName).toBe("");
  });

  it("rejects a payload that is missing fields entirely", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ firstName: "Ada" }));

    await expect(getProfile()).rejects.toBeInstanceOf(
      ApiResponseValidationError,
    );
  });

  it("rejects a payload whose fields are not strings", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ...VALID_PROFILE, firstName: 42 }),
    );

    await expect(getProfile()).rejects.toBeInstanceOf(
      ApiResponseValidationError,
    );
  });
});

describe("getProfile — error paths", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("surfaces a non-2xx response as an http error carrying the status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { ok: false, status: 503 }));

    const error = await getProfile().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProfileApiError);
    expect((error as ProfileApiError).code).toBe("http");
    expect((error as ProfileApiError).status).toBe(503);
  });

  it("surfaces a transport failure as a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await getProfile().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProfileApiError);
    expect((error as ProfileApiError).code).toBe("network");
  });

  it("surfaces an undecodable body as an invalid_response error", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    } as unknown as Response);

    const error = await getProfile().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProfileApiError);
    expect((error as ProfileApiError).code).toBe("invalid_response");
  });

  it("propagates a caller abort as an AbortError rather than a failure", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    const pending = getProfile(controller.signal);
    controller.abort();

    const error = await pending.catch((e: unknown) => e);
    expect((error as Error).name).toBe("AbortError");
    expect(error).not.toBeInstanceOf(ProfileApiError);
  });
});

describe("getProfile — slow response path", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("stays pending until the response arrives", async () => {
    const gate = deferred<Response>();
    fetchMock.mockReturnValue(gate.promise);

    let settled = false;
    const pending = getProfile().then((result) => {
      settled = true;
      return result;
    });

    // Nothing has arrived yet: the caller can still render its loading state.
    await Promise.resolve();
    expect(settled).toBe(false);

    gate.resolve(jsonResponse(VALID_PROFILE));
    const result = await pending;

    expect(settled).toBe(true);
    expect(result.source).toBe("api");
  });

  it("aborts a request that outlives the timeout budget", async () => {
    vi.useFakeTimers();
    try {
      let capturedSignal: AbortSignal | undefined;
      fetchMock.mockImplementation((_url: string, init: { signal: AbortSignal }) => {
        capturedSignal = init.signal;
        return new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      });

      const pending = getProfile().catch((e: unknown) => e);
      await vi.advanceTimersByTimeAsync(PROFILE_REQUEST_TIMEOUT_MS + 1);

      expect(capturedSignal?.aborted).toBe(true);
      const error = await pending;
      expect(error).toBeInstanceOf(ProfileApiError);
      expect((error as ProfileApiError).code).toBe("timeout");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("getProfile — placeholder path", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not call fetch and flags the result as placeholder", async () => {
    const result = await getProfile();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe("placeholder");
    if (result.source === "placeholder") {
      expect(result.reason).toBe("api_base_url_missing");
    }
  });

  it("returns seeded demo data that is clearly not the user's own", async () => {
    const result = await getProfile();

    expect(result.profile.email).toBe("user@example.com");
  });
});

describe("saveProfile", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("PUTs the profile to the configured API base URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", `${API_BASE}/`);
    fetchMock.mockResolvedValue(jsonResponse(VALID_PROFILE));

    const result = await saveProfile(VALID_PROFILE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(PROFILE_URL);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toMatchObject({
      firstName: "Ada",
    });
    expect(result.source).toBe("api");
  });

  it("validates the outgoing payload before sending it", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    const malformed = { firstName: 7 } as unknown as ProfileData;

    await expect(saveProfile(malformed)).rejects.toBeInstanceOf(
      ApiResponseValidationError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports staging instead of a write when the API is unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    const result = await saveProfile(VALID_PROFILE);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe("placeholder");
  });

  it("rejects when the server rejects the write", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockResolvedValue(jsonResponse({}, { ok: false, status: 422 }));

    const error = await saveProfile(VALID_PROFILE).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ProfileApiError);
    expect((error as ProfileApiError).code).toBe("http");
    expect((error as ProfileApiError).status).toBe(422);
  });
});
