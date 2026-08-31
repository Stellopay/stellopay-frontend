import { describe, expect, it } from "vitest";
import {
  CONTENT_SECURITY_POLICY,
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
  it("applies the full set of required headers", () => {
    const keys = SECURITY_HEADERS.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "X-Frame-Options",
        "Strict-Transport-Security",
        "Referrer-Policy",
        "X-Content-Type-Options",
      ]),
    );
  });

  it("rejects unsafe inline scripts and eval in script-src", () => {
    const scriptSrc = CSP_DIRECTIVES.find((d) => d.startsWith("script-src"));
    expect(scriptSrc).toBe("script-src 'self'");
    // Explicitly assert no unsafe-inline / unsafe-eval in the script directive.
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("still permits inline styles required by Next/Tailwind in style-src only", () => {
    const styleSrc = CSP_DIRECTIVES.find((d) => d.startsWith("style-src"));
    expect(styleSrc).toContain("'self'");
    // style-src may keep 'unsafe-inline', but script-src must not inherit it.
    expect(
      CSP_DIRECTIVES.find((d) => d.startsWith("script-src")),
    ).not.toContain("'unsafe-inline'");
  });

  it("rejects all cross-origin framing via frame-ancestors 'none'", () => {
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
