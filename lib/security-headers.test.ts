import { describe, expect, it } from "vitest";
import {
  buildCsp,
  CSP_DIRECTIVES,
  PERMISSIONS_POLICY,
  REFERRER_POLICY,
  SECURITY_HEADERS,
  STRICT_TRANSPORT_SECURITY,
  X_CONTENT_TYPE_OPTIONS,
  X_FRAME_OPTIONS,
  X_XSS_PROTECTION,
} from "./security-headers";

describe("security-headers", () => {
  it("builds a nonce-based script policy and allows eval only in development", () => {
    const productionCsp = buildCsp("request-nonce", false);
    expect(productionCsp).toBe(
      "script-src 'nonce-request-nonce' 'strict-dynamic'; " +
        "default-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; font-src 'self'; " +
        "connect-src 'self' https://stellar.org https://horizon.stellar.org " +
        "https://soroban.stellar.org https://horizon-testnet.stellar.org " +
        "https://horizon-futurenet.stellar.org; frame-ancestors 'none'; " +
        "base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
    );
    expect(buildCsp("request-nonce", true)).toBe(
      productionCsp.replace("'strict-dynamic'", "'strict-dynamic' 'unsafe-eval'"),
    );
  });

  it("keeps the existing non-CSP security headers", () => {
    const keys = SECURITY_HEADERS.map((header) => header.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "X-Frame-Options",
        "Strict-Transport-Security",
        "Referrer-Policy",
        "X-Content-Type-Options",
      ]),
    );
    expect(keys).not.toContain("Content-Security-Policy");
    expect(SECURITY_HEADERS).toContainEqual({
      key: "Permissions-Policy",
      value: PERMISSIONS_POLICY,
    });
    expect(SECURITY_HEADERS).toContainEqual({
      key: "X-XSS-Protection",
      value: X_XSS_PROTECTION,
    });
  });

  it("allows inline styles only in style-src", () => {
    const styleSrc = CSP_DIRECTIVES.find((directive) =>
      directive.startsWith("style-src"),
    );
    expect(styleSrc).toContain("'self'");
    expect(styleSrc).toContain("'unsafe-inline'");
    expect(buildCsp("request-nonce", false)).not.toContain(
      "script-src 'unsafe-inline'",
    );
  });

  it("rejects all cross-origin framing", () => {
    expect(CSP_DIRECTIVES).toContain("frame-ancestors 'none'");
    expect(X_FRAME_OPTIONS).toBe("DENY");
  });

  it("enforces transport security via HSTS", () => {
    expect(STRICT_TRANSPORT_SECURITY).toContain("max-age=");
    expect(STRICT_TRANSPORT_SECURITY).toContain("includeSubDomains");
  });

  it("restricts referrer leakage to same-origin", () => {
    expect(REFERRER_POLICY).toBe("strict-origin-when-cross-origin");
  });

  it("prevents MIME type sniffing", () => {
    expect(X_CONTENT_TYPE_OPTIONS).toBe("nosniff");
  });
});
