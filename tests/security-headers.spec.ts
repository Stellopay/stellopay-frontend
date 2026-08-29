// End-to-end security-header check (issue #1174).
//
// This spec asserts that the deployed preview (or the local production build)
// actually serves the intended security policy. It runs against whatever
// server the Playwright webServer/browserBaseURL points at — in CI that is
// the production preview; locally you can point it at `npm run build` +
// `npm run start`.
//
// The policy it verifies is defined once in lib/security-headers.ts and wired
// into next.config.ts, so a header cannot drift without this test failing.
//
// Representative routes:  HTML document (public + authenticated shell) and a
// hashed static asset (declares the content-type / inline protections that
// apply to served files).
//
// A failing assertion names the exact header + directive that regressed.

import { expect, test, type APIResponse } from "@playwright/test";
import {
  CONTENT_SECURITY_POLICY,
  REFERRER_POLICY,
  STRICT_TRANSPORT_SECURITY,
  X_CONTENT_TYPE_OPTIONS,
  X_FRAME_OPTIONS,
} from "../lib/security-headers";

/** Routes exercised by the check: a public page and the app shell. */
const REPRESENTATIVE_ROUTES = ["/", "/dashboard"];

/**
 * Required headers asserted on every representative route and on a hashed
 * static asset. Value is a predicate (true = header matches expected policy).
 */
const REQUIRED_HEADERS: Record<string, (value: string | null) => boolean> = {
  "Content-Security-Policy": (v) => v === CONTENT_SECURITY_POLICY,
  "X-Frame-Options": (v) => v === X_FRAME_OPTIONS,
  "Strict-Transport-Security": (v) => v === STRICT_TRANSPORT_SECURITY,
  "Referrer-Policy": (v) => v === REFERRER_POLICY,
  "X-Content-Type-Options": (v) => v === X_CONTENT_TYPE_OPTIONS,
};

/** Directives that must NOT appear in the served script-src (rejects unsafe inline/eval). */
const FORBIDDEN_SCRIPT_DIRECTIVES = ["'unsafe-inline'", "'unsafe-eval'"];

/** Extract the value of a single CSP directive (e.g. script-src …; -> 'self'). */
function cspDirective(csp: string, name: string): string | null {
  const match = csp.match(new RegExp(`(?:^|;)\\s*${name}\\s+([^;]+)`));
  return match ? match[1].trim() : null;
}

/** Assert that `response` satisfies the full required-header policy. */
function assertPolicyOnResponse(name: string, response: APIResponse): void {
  for (const [header, matches] of Object.entries(REQUIRED_HEADERS)) {
    const value = response.headers()[header.toLowerCase()] ?? null;
    expect(
      matches(value),
      `[${name}] missing or weakened header "${header}". ` +
        `Expected "${header}" to match the policy; got ${JSON.stringify(value || null)}`,
    ).toBe(true);
  }

  // The policy must reject unsafe inline / eval'd scripts and cross-origin framing.
  const csp = response.headers()["content-security-policy"] ?? "";
  const scriptSrc = cspDirective(csp, "script-src");
  expect(
    scriptSrc,
    `[${name}] CSP must define a script-src directive`,
  ).toBeTruthy();
  for (const directive of FORBIDDEN_SCRIPT_DIRECTIVES) {
    expect(
      scriptSrc!.includes(directive),
      `[${name}] script-src must reject ${directive} (unsafe inline/eval)`,
    ).toBe(false);
  }
  expect(
    csp.includes("frame-ancestors 'none'"),
    `[${name}] CSP must deny framing via frame-ancestors 'none'`,
  ).toBe(true);
}

test.describe("Security headers on representative routes", () => {
  for (const route of REPRESENTATIVE_ROUTES) {
    test(`responds with the required security policy on ${route}`, async ({
      request,
      baseURL,
    }) => {
      const res = await request.get(`${baseURL}${route}`);
      expect(res.status(), `${route} should return 200`).toBe(200);
      assertPolicyOnResponse(route, res);
    });
  }
});

test.describe("Security headers on static assets", () => {
  test("responds with content-type and framing protection on a hashed asset", async ({
    request,
    baseURL,
  }) => {
    // Fetch the landing page first to discover a real content-hashed asset.
    const page = await request.get(`${baseURL}/`);
    expect(page.status()).toBe(200);

    const html = await page.text();
    const match =
      html.match(/src="(\/_next\/static\/[^"]+\.js)"/) ??
      html.match(/href="(\/_next\/static\/[^"]+\.css)"/);
    expect(
      match,
      "landing page should reference a _next/static asset",
    ).toBeTruthy();

    const assetUrl = `${baseURL}${match![1]}`;
    const asset = await request.get(assetUrl);
    expect(asset.status()).toBe(200);

    assertPolicyOnResponse("static asset", asset);
  });
});

test.describe("Security policy rejects unsafe behavior", () => {
  test("script-src rejects unsafe-inline and unsafe-eval on every representative route", async ({
    request,
    baseURL,
  }) => {
    for (const route of REPRESENTATIVE_ROUTES) {
      const res = await request.get(`${baseURL}${route}`);
      const csp = res.headers()["content-security-policy"] ?? "";
      const scriptSrc = cspDirective(csp, "script-src");
      expect(
        scriptSrc,
        `[${route}] CSP must define a script-src directive`,
      ).toBeTruthy();
      for (const directive of FORBIDDEN_SCRIPT_DIRECTIVES) {
        expect(
          scriptSrc!.includes(directive),
          `[${route}] script-src must reject ${directive}`,
        ).toBe(false);
      }
    }
  });
});
