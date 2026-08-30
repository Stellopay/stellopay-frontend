/**
 * @file lib/security-headers.ts
 *
 * Single source of truth for the app's HTTP security headers.
 *
 * These values are consumed by:
 *  - next.config.ts  (applied to every route via the Next.js `headers()` hook)
 *  - tests/security-headers.spec.ts  (Playwright preview checks)
 *
 * Centralizing the policy here means the test asserts against the exact
 * directives the server actually sends — a header can't drift without the
 * check failing. A failing assertion names the header and directive that
 * regressed, so the policy can be corrected rather than silently weakened.
 *
 * Requirement coverage (issue #1174):
 *  - CSP            → Content-Security-Policy
 *  - frame          → X-Frame-Options + CSP frame-ancestors
 *  - transport      → Strict-Transport-Security (HSTS)
 *  - referrer       → Referrer-Policy
 *  - content-type   → X-Content-Type-Options
 */

/** Collectively enforced CSP directives that reject unsafe inline/cross-origin behavior. */
export const CSP_DIRECTIVES: string[] = [
  // No inline or eval'd scripts: resources must come from the same origin.
  "default-src 'self'",
  "script-src 'self'",
  // Styles allow inline so Tailwind/Next injected <style> nodes work.
  "style-src 'self' 'unsafe-inline'",
  // Images may be data/blob for icons & avatars; nothing external besides self.
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Same-origin API + specific Stellar network hosts only.
  "connect-src 'self' https://stellar.org https://horizon.stellar.org https://soroban.stellar.org",
  // Reject all framing of this site (clickjacking defence).
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
];

/** Full serialized Content-Security-Policy header value. */
export const CONTENT_SECURITY_POLICY = CSP_DIRECTIVES.join("; ");

export const X_FRAME_OPTIONS = "DENY";

/** 2-year HSTS; includeSubDomains + preload for transport security. */
export const STRICT_TRANSPORT_SECURITY =
  "max-age=63072000; includeSubDomains; preload";

export const REFERRER_POLICY = "strict-origin-when-cross-origin";

export const X_CONTENT_TYPE_OPTIONS = "nosniff";

export const X_XSS_PROTECTION = "1; mode=block";

export const PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), interest-cohort=()";

/**
 * The exact { key, value } objects applied by Next.js `headers()`.
 * Exported so the Playwright preview check and config can never disagree.
 */
export const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: X_FRAME_OPTIONS },
  { key: "Strict-Transport-Security", value: STRICT_TRANSPORT_SECURITY },
  { key: "Referrer-Policy", value: REFERRER_POLICY },
  { key: "X-Content-Type-Options", value: X_CONTENT_TYPE_OPTIONS },
  { key: "X-XSS-Protection", value: X_XSS_PROTECTION },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
] as const;
