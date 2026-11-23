/**
 * @fileoverview Tests for lib/totp.ts
 *
 * Covers:
 * - generateTotpSecret: base32 secret shape, otpauth URL with issuer/label
 * - verifyTotpCode: a valid code verifies, wrong codes fail, the default
 *   window accepts an adjacent step, the `window` parameter widens
 *   acceptance, and malformed tokens fail safely
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import speakeasy from "speakeasy";
import { generateTotpSecret, verifyTotpCode } from "./totp";

// 1700000100 is a multiple of the 30-second TOTP step, so counters land on
// exact boundaries and the tests do not depend on when they run.
const FIXED_TIME_MS = 1700000100 * 1000;
const STEP_MS = 30 * 1000;

const ISSUER = "StelloPay";
const LABEL = "eulami@example.com";

/** Generate a token for `secret` at the currently mocked time. */
function currentToken(secret: string): string {
  return speakeasy.totp({ secret, encoding: "base32" });
}

/** A 6-digit token guaranteed to differ from `token`. */
function wrongToken(token: string): string {
  const lastDigit = token[token.length - 1];
  const replacement = lastDigit === "0" ? "1" : "0";
  return token.slice(0, -1) + replacement;
}

describe("generateTotpSecret", () => {
  it("returns a base32 secret", () => {
    const { base32 } = generateTotpSecret(ISSUER, LABEL);

    expect(typeof base32).toBe("string");
    expect(base32.length).toBeGreaterThanOrEqual(16);
    // Base32 alphabet only, no padding.
    expect(base32).toMatch(/^[A-Z2-7]+$/);
  });

  it("returns an otpauth URL containing the issuer, label and secret", () => {
    const { base32, otpauthUrl } = generateTotpSecret(ISSUER, LABEL);

    expect(otpauthUrl.startsWith("otpauth://totp/")).toBe(true);
    expect(otpauthUrl).toContain(encodeURIComponent(ISSUER));
    expect(otpauthUrl).toContain(encodeURIComponent(LABEL));
    expect(otpauthUrl).toContain(`secret=${base32}`);
  });

  it("generates distinct secrets on each call", () => {
    const first = generateTotpSecret(ISSUER, LABEL);
    const second = generateTotpSecret(ISSUER, LABEL);

    expect(first.base32).not.toBe(second.base32);
  });
});

describe("verifyTotpCode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_TIME_MS));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a code generated for the secret at the current time", () => {
    const { base32 } = generateTotpSecret(ISSUER, LABEL);

    expect(verifyTotpCode(base32, currentToken(base32))).toBe(true);
  });

  it("rejects a wrong code", () => {
    const { base32 } = generateTotpSecret(ISSUER, LABEL);
    const token = currentToken(base32);

    expect(verifyTotpCode(base32, wrongToken(token))).toBe(false);
  });

  it("rejects a code from outside the acceptance window", () => {
    const { base32 } = generateTotpSecret(ISSUER, LABEL);
    const token = currentToken(base32);

    // Three steps later: beyond the default window of ±1.
    vi.setSystemTime(new Date(FIXED_TIME_MS + 3 * STEP_MS));

    expect(verifyTotpCode(base32, token)).toBe(false);
  });

  it("accepts a code from the adjacent step within the default window", () => {
    const { base32 } = generateTotpSecret(ISSUER, LABEL);
    const token = currentToken(base32);

    // One step later: still inside the default window of ±1.
    vi.setSystemTime(new Date(FIXED_TIME_MS + STEP_MS));

    expect(verifyTotpCode(base32, token)).toBe(true);
  });

  it("widens acceptance by one step when window is larger", () => {
    const { base32 } = generateTotpSecret(ISSUER, LABEL);
    const token = currentToken(base32);

    // Two steps later: outside ±1, inside ±2.
    vi.setSystemTime(new Date(FIXED_TIME_MS + 2 * STEP_MS));

    expect(verifyTotpCode(base32, token, 1)).toBe(false);
    expect(verifyTotpCode(base32, token, 2)).toBe(true);
  });

  it("rejects the same code even with a wide window once far enough away", () => {
    const { base32 } = generateTotpSecret(ISSUER, LABEL);
    const token = currentToken(base32);

    vi.setSystemTime(new Date(FIXED_TIME_MS + 10 * STEP_MS));

    expect(verifyTotpCode(base32, token, 3)).toBe(false);
  });

  it.each([
    ["non-numeric", "abcdef"],
    ["too short", "12345"],
    ["too long", "1234567"],
    ["empty", ""],
    ["whitespace", "      "],
  ])("returns false for a malformed token (%s)", (_case, token) => {
    const { base32 } = generateTotpSecret(ISSUER, LABEL);

    expect(verifyTotpCode(base32, token)).toBe(false);
  });
});
