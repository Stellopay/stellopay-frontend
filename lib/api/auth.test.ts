import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  login,
  verifyEmailToken,
  resendVerificationEmail,
  sendMagicLink,
  simulateOAuth,
  AuthError,
  VerifyEmailError,
  OAuthCallbackError,
} from "./auth";

// Mock the global fetch
global.fetch = vi.fn();

describe("lib/api/auth.ts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("login", () => {
    const validCredentials = { email: "test@example.com", password: "password123", rememberMe: false };

    it("should resolve on a successful 200 response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await expect(login(validCredentials)).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/login"), expect.objectContaining({
        method: "POST",
        body: JSON.stringify(validCredentials),
      }));
    });

    it("should throw AuthError on 4xx response (invalid credentials)", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const promise = login(validCredentials);
      await expect(promise).rejects.toThrow(AuthError);
      await expect(promise).rejects.toThrow("Invalid email or password. Please try again.");
    });

    it("should throw AuthError (network) on 5xx response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const promise = login(validCredentials);
      await expect(promise).rejects.toThrow(AuthError);
      await expect(promise).rejects.toThrow("We're having trouble reaching our servers. Please try again.");
      await expect(promise).rejects.toMatchObject({ kind: "network" });
    });

    it("should throw AuthError (network) on fetch network rejection", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

      const promise = login(validCredentials);
      await expect(promise).rejects.toThrow(AuthError);
      await expect(promise).rejects.toThrow("Unable to connect. Please check your internet connection and try again.");
      await expect(promise).rejects.toMatchObject({ kind: "network" });
    });
  });

  describe("verifyEmailToken", () => {
    const token = "valid-token";

    it("should resolve on a successful 200 response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await expect(verifyEmailToken(token)).resolves.toBeUndefined();
    });

    it("should throw VerifyEmailError (TOKEN_EXPIRED) when body.code is TOKEN_EXPIRED", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: "TOKEN_EXPIRED" }),
      } as Response);

      const promise = verifyEmailToken(token);
      await expect(promise).rejects.toThrow(VerifyEmailError);
      await expect(promise).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    });

    it("should throw VerifyEmailError (TOKEN_INVALID) when body.code is TOKEN_INVALID", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: "TOKEN_INVALID" }),
      } as Response);

      const promise = verifyEmailToken(token);
      await expect(promise).rejects.toThrow(VerifyEmailError);
      await expect(promise).rejects.toMatchObject({ code: "TOKEN_INVALID" });
    });

    it("should throw VerifyEmailError (VERIFICATION_FAILED) on other fetch errors that aren't specific codes", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: "UNKNOWN_CODE" }),
      } as Response);

      const promise = verifyEmailToken(token);
      await expect(promise).rejects.toThrow(VerifyEmailError);
      await expect(promise).rejects.toMatchObject({ code: "VERIFICATION_FAILED" });
    });

    it("should throw generic Error on fetch network rejection", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(verifyEmailToken(token)).rejects.toThrow("An error occurred during verification. Please try again later.");
    });
  });

  describe("resendVerificationEmail", () => {
    const email = "test@example.com";

    it("should resolve on a successful 200 response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await expect(resendVerificationEmail(email)).resolves.toBeUndefined();
    });

    it("should throw Error on non-200 response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(resendVerificationEmail(email)).rejects.toThrow("Failed to resend verification email. Please try again.");
    });

    it("should throw generic Error on fetch network rejection", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(resendVerificationEmail(email)).rejects.toThrow("An error occurred. Please try again later.");
    });
  });

  describe("sendMagicLink", () => {
    const email = "test@example.com";

    it("should resolve on a successful 200 response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      await expect(sendMagicLink(email)).resolves.toBeUndefined();
    });

    it("should throw AuthError on non-200 response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(sendMagicLink(email)).rejects.toThrow(AuthError);
      await expect(sendMagicLink(email)).rejects.toThrow("Could not send login link. Please check the email address and try again.");
    });

    it("should throw AuthError on fetch network rejection", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(sendMagicLink(email)).rejects.toThrow(AuthError);
      await expect(sendMagicLink(email)).rejects.toThrow("An error occurred. Please try again later.");
    });
  });

  describe("simulateOAuth", () => {
    it("should always throw OAuthCallbackError", async () => {
      const originalConsoleError = console.error;
      console.error = vi.fn(); // Suppress the expected error log

      const promise = simulateOAuth("google");
      await expect(promise).rejects.toThrow(OAuthCallbackError);
      
      const error = await promise.catch(e => e);
      expect(["access_denied", "provider_unavailable", "account_exists_different_method"]).toContain(error.code);

      console.error = originalConsoleError;
    });
  });
});
