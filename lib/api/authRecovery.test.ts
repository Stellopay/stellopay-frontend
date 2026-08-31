import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  authenticatedFetch,
  setTokens,
  getTokens,
  setCustomRefreshHandler,
  setAuthFailureHandler,
  resetRecoveryState,
  AuthExpiredError,
  generateIdempotencyKey,
  completeReauth,
} from "./authRecovery";

describe("authRecovery service", () => {
  beforeEach(() => {
    resetRecoveryState();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetRecoveryState();
    vi.restoreAllMocks();
  });

  it("attaches access and CSRF tokens to request headers when available", async () => {
    setTokens({ accessToken: "access-123", csrfToken: "csrf-456" });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await authenticatedFetch("https://api.example.com/data");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer access-123");
    expect(headers.get("X-CSRF-Token")).toBe("csrf-456");
  });

  it("triggers at most one refresh attempt shared by concurrent expiring requests", async () => {
    setTokens({ accessToken: "expired-token", csrfToken: "expired-csrf" });

    let refreshCallCount = 0;
    const refreshHandler = vi.fn().mockImplementation(async () => {
      refreshCallCount++;
      // Simulate network delay for refresh
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { accessToken: "new-access-token", csrfToken: "new-csrf-token" };
    });
    setCustomRefreshHandler(refreshHandler);

    let requestAttempts = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      requestAttempts++;
      const headers = new Headers(init?.headers);

      // Initial request with expired token fails with 401
      if (headers.get("Authorization") === "Bearer expired-token") {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }

      // Retried request with new token succeeds
      if (headers.get("Authorization") === "Bearer new-access-token") {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      return new Response(null, { status: 500 });
    });

    // Launch 4 concurrent requests
    const promises = [
      authenticatedFetch("https://api.example.com/resource1"),
      authenticatedFetch("https://api.example.com/resource2"),
      authenticatedFetch("https://api.example.com/resource3"),
      authenticatedFetch("https://api.example.com/resource4"),
    ];

    const results = await Promise.all(promises);

    // All 4 requests should resolve with status 200
    expect(results).toHaveLength(4);
    results.forEach((res) => expect(res.status).toBe(200));

    // Crucially: refresh token handler was invoked ONLY ONCE despite 4 concurrent 401 responses
    expect(refreshCallCount).toBe(1);
    expect(getTokens()).toEqual({
      accessToken: "new-access-token",
      csrfToken: "new-csrf-token",
    });
  });

  it("stops retrying and triggers failure handler when refresh fails (non-recoverable)", async () => {
    setTokens({ accessToken: "expired-token" });

    const refreshHandler = vi.fn().mockRejectedValue(new Error("Refresh token expired"));
    setCustomRefreshHandler(refreshHandler);

    const failureListener = vi.fn();
    setAuthFailureHandler(failureListener);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Token expired" }), { status: 401 })
    );

    await expect(
      authenticatedFetch("https://api.example.com/protected")
    ).rejects.toThrow(AuthExpiredError);

    expect(refreshHandler).toHaveBeenCalledTimes(1);
    expect(failureListener).toHaveBeenCalledTimes(1);
    expect(failureListener.mock.calls[0][0]).toBeInstanceOf(AuthExpiredError);
  });

  it("stops retrying when retried request fails with 401 again (no infinite loops)", async () => {
    setTokens({ accessToken: "expired-token" });

    setCustomRefreshHandler(async () => ({ accessToken: "still-invalid-token" }));

    const failureListener = vi.fn();
    setAuthFailureHandler(failureListener);

    // Fetch always returns 401 regardless of token
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 })
    );

    await expect(
      authenticatedFetch("https://api.example.com/protected")
    ).rejects.toThrow(AuthExpiredError);

    expect(failureListener).toHaveBeenCalledTimes(1);
  });

  it("attaches and preserves Idempotency-Key guard for protected mutations during replay", async () => {
    setTokens({ accessToken: "expired-token" });

    setCustomRefreshHandler(async () => ({ accessToken: "fresh-token" }));

    const capturedIdempotencyKeys: string[] = [];

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const headers = new Headers(init?.headers);
      const idempotencyKey = headers.get("Idempotency-Key");
      if (idempotencyKey) {
        capturedIdempotencyKeys.push(idempotencyKey);
      }

      if (headers.get("Authorization") === "Bearer expired-token") {
        return new Response(null, { status: 401 });
      }

      return new Response(JSON.stringify({ created: true }), { status: 201 });
    });

    const customKey = "custom-idempotency-key-999";
    const response = await authenticatedFetch("https://api.example.com/payments", {
      method: "POST",
      body: JSON.stringify({ amount: 100 }),
      idempotencyKey: customKey,
    });

    expect(response.status).toBe(201);
    // Both initial request and replayed mutation must use the SAME idempotency key
    expect(capturedIdempotencyKeys).toHaveLength(2);
    expect(capturedIdempotencyKeys[0]).toBe(customKey);
    expect(capturedIdempotencyKeys[1]).toBe(customKey);
  });

  it("generates an Idempotency-Key for mutations if none is provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await authenticatedFetch("https://api.example.com/update", {
      method: "PUT",
      body: JSON.stringify({ name: "test" }),
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Idempotency-Key")).toBeTruthy();
    expect(headers.get("Idempotency-Key")).toMatch(/^idempotency-|^[0-9a-f-]{36}$/);
  });

  it("clears protected tokens when refresh fails (session invalidated)", async () => {
    setTokens({ accessToken: "expired-token", csrfToken: "expired-csrf" });

    const refreshHandler = vi.fn().mockRejectedValue(new Error("Refresh token expired"));

    setCustomRefreshHandler(refreshHandler);

    const failureListener = vi.fn();
    setAuthFailureHandler(failureListener);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Token expired" }), { status: 401 })
    );

    await expect(
      authenticatedFetch("https://api.example.com/protected")
    ).rejects.toThrow(AuthExpiredError);

    // Protected tokens must be cleared on failed refresh
    expect(getTokens()).toEqual({});
    expect(refreshHandler).toHaveBeenCalledTimes(1);
    expect(failureListener).toHaveBeenCalledTimes(1);
    expect(failureListener.mock.calls[0][0]).toBeInstanceOf(AuthExpiredError);
  });

  it("allows retry with new tokens after successful refresh", async () => {
    setTokens({ accessToken: "expired-token", csrfToken: "expired-csrf" });

    let refreshCallCount = 0;
    const refreshHandler = vi.fn().mockImplementation(async () => {
      refreshCallCount++;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { accessToken: "new-access-token", csrfToken: "new-csrf-token" };
    });
    setCustomRefreshHandler(refreshHandler);

    let requestAttempts = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      requestAttempts++;
      const headers = new Headers(init?.headers);

      if (headers.get("Authorization") === "Bearer expired-token") {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }

      if (headers.get("Authorization") === "Bearer new-access-token") {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      return new Response(null, { status: 500 });
    });

    const promises = [
      authenticatedFetch("https://api.example.com/resource1"),
      authenticatedFetch("https://api.example.com/resource2"),
    ];

    const results = await Promise.all(promises);

    expect(results).toHaveLength(2);
    results.forEach((res) => expect(res.status).toBe(200));
    expect(refreshCallCount).toBe(1);
    expect(getTokens()).toEqual({
      accessToken: "new-access-token",
      csrfToken: "new-csrf-token",
    });
  });

  it("triggers reauth dialog when refresh fails via context failure handler", async () => {
    resetRecoveryState();

    const refreshHandler = vi.fn().mockRejectedValue(new Error("Invalid refresh token"));
    setCustomRefreshHandler(refreshHandler);

    const failureListener = vi.fn();
    setAuthFailureHandler(failureListener);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Token expired" }), { status: 401 })
    );

    await expect(
      authenticatedFetch("https://api.example.com/protected")
    ).rejects.toThrow(AuthExpiredError);

    expect(failureListener).toHaveBeenCalledTimes(1);
    expect(failureListener.mock.calls[0][0]).toBeInstanceOf(AuthExpiredError);
  });
});
