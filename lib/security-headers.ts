/**
 * @file lib/security-headers.ts
 *
 * Single source of truth for the app's HTTP security headers.
 *
 * These values are consumed by:
 *  - middleware.ts (the request-specific Content-Security-Policy)
 *  - next.config.ts (the remaining static security headers)
 *  - tests/security-headers.spec.ts (Playwright preview checks)
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

/** Static CSP directives shared by all requests. */
export const CSP_DIRECTIVES: string[] = [
  "default-src 'self'",
  // Styles allow inline so Tailwind/Next injected <style> nodes work.
  "style-src 'self' 'unsafe-inline'",
  // Images may be data/blob for icons & avatars; nothing external besides self.
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Same-origin API + supported Stellar network hosts only.
  "connect-src 'self' https://stellar.org https://horizon.stellar.org https://soroban.stellar.org https://horizon-testnet.stellar.org https://horizon-futurenet.stellar.org",
  // Reject all framing of this site (clickjacking defence).
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
];

/** Build the per-request CSP; eval is permitted only by the development server. */
export function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = `script-src 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`;
  return [scriptSrc, ...CSP_DIRECTIVES].join("; ");
}

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
 * The exact static headers applied by Next.js `headers()`.
 * CSP is intentionally omitted because it requires a request-specific nonce.
 */
export const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: X_FRAME_OPTIONS },
  { key: "Strict-Transport-Security", value: STRICT_TRANSPORT_SECURITY },
  { key: "Referrer-Policy", value: REFERRER_POLICY },
  { key: "X-Content-Type-Options", value: X_CONTENT_TYPE_OPTIONS },
  { key: "X-XSS-Protection", value: X_XSS_PROTECTION },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
] as const;
