import { renderHook, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useProfile } from "./useProfile";
import { ProfileApiError } from "@/lib/api/profile";
import type { ProfileData } from "@/types/profile";

const API_BASE = "https://api.stellopay.test";

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

const EMPTY_PROFILE = Object.fromEntries(
  Object.keys(VALID_PROFILE).map((key) => [key, ""]),
) as ProfileData;

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("useProfile", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("starts in the loading state", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useProfile());

    expect(result.current.status).toBe("loading");
    expect(result.current.profile).toBeNull();
  });

  it("moves to success and reports an api source", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockResolvedValue(jsonResponse(VALID_PROFILE));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.profile).toMatchObject({ firstName: "Ada" });
    expect(result.current.source).toBe("api");
    expect(result.current.error).toBeNull();
  });

  it("passes an all-empty profile through as a success, not an error", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockResolvedValue(jsonResponse(EMPTY_PROFILE));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.profile?.firstName).toBe("");
  });

  it("moves to error when the request fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBeInstanceOf(ProfileApiError);
  });

  it("recovers when the user retries after an error", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockResolvedValueOnce(jsonResponse(VALID_PROFILE));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.status).toBe("error"));

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.profile).toMatchObject({ firstName: "Ada" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stays in the loading state while a slow response is in flight", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    const gate = deferred<Response>();
    fetchMock.mockReturnValue(gate.promise);

    const { result } = renderHook(() => useProfile());

    await Promise.resolve();
    expect(result.current.status).toBe("loading");

    await act(async () => {
      gate.resolve(jsonResponse(VALID_PROFILE));
    });

    await waitFor(() => expect(result.current.status).toBe("success"));
  });

  it("surfaces the placeholder source when the API is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    fetchMock.mockResolvedValue(jsonResponse(VALID_PROFILE));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.source).toBe("placeholder");
    expect(result.current.placeholderReason).toBe("api_base_url_missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts the in-flight request when the consumer unmounts", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE);
    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: { signal: AbortSignal }) => {
      capturedSignal = init.signal;
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => useProfile());
    await waitFor(() => expect(capturedSignal).toBeDefined());

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
