// End-to-end security-header check (issue #1174).
//
// This spec asserts that the deployed preview (or the local production build)
// actually serves the intended security policy. It runs against whatever
// server the Playwright webServer/browserBaseURL points at — in CI that is
// the production preview; locally you can point it at `npm run build` +
// `npm run start`.
//
// The policy it verifies is defined once in lib/security-headers.ts and wired
// into middleware.ts, so a header cannot drift without this test failing.
//
// Representative routes: HTML documents on public, auth, and protected paths,
// plus a hashed static asset for the remaining static security headers.
//
// A failing assertion names the exact header + directive that regressed.

import { expect, test, type APIResponse } from "@playwright/test";
import {
  buildCsp,
  PERMISSIONS_POLICY,
  REFERRER_POLICY,
  STRICT_TRANSPORT_SECURITY,
  X_CONTENT_TYPE_OPTIONS,
  X_FRAME_OPTIONS,
  X_XSS_PROTECTION,
} from "../lib/security-headers";

/** Public, auth, and protected routes exercised by the check. */
const REPRESENTATIVE_ROUTES = ["/", "/auth/login", "/dashboard"];

/**
 * Required headers asserted on every representative route and on a hashed
 * static asset. Value is a predicate (true = header matches expected policy).
 */
const REQUIRED_HEADERS: Record<string, (value: string | null) => boolean> = {
  "X-Frame-Options": (v) => v === X_FRAME_OPTIONS,
  "Strict-Transport-Security": (v) => v === STRICT_TRANSPORT_SECURITY,
  "Referrer-Policy": (v) => v === REFERRER_POLICY,
  "X-Content-Type-Options": (v) => v === X_CONTENT_TYPE_OPTIONS,
  "X-XSS-Protection": (v) => v === X_XSS_PROTECTION,
  "Permissions-Policy": (v) => v === PERMISSIONS_POLICY,
};

/** Extract the value of a single CSP directive (e.g. script-src …; -> 'self'). */
function cspDirective(csp: string, name: string): string | null {
  const match = csp.match(new RegExp(`(?:^|;)\\s*${name}\\s+([^;]+)`));
  return match ? match[1].trim() : null;
}

/** Assert that `response` satisfies the static security-header policy. */
function assertPolicyOnResponse(name: string, response: APIResponse): void {
  for (const [header, matches] of Object.entries(REQUIRED_HEADERS)) {
    const value = response.headers()[header.toLowerCase()] ?? null;
    expect(
      matches(value),
      `[${name}] missing or weakened header "${header}". ` +
        `Expected "${header}" to match the policy; got ${JSON.stringify(value || null)}`,
    ).toBe(true);
  }
}

function assertNoncePolicyAndScriptParity(
  name: string,
  response: APIResponse,
  html: string,
): string {
  const csp = response.headers()["content-security-policy"] ?? "";
  const scriptSrc = cspDirective(csp, "script-src");
  expect(
    scriptSrc,
    `[${name}] CSP must define a script-src directive`,
  ).toBeTruthy();
  const nonceMatch = scriptSrc!.match(
    /^'nonce-([^']+)' 'strict-dynamic'(?: 'unsafe-eval')?$/,
  );
  expect(
    nonceMatch,
    `[${name}] script-src must contain a nonce and strict-dynamic`,
  ).toBeTruthy();
  const nonce = nonceMatch![1];
  expect([buildCsp(nonce, false), buildCsp(nonce, true)]).toContain(csp);

  const scriptTags = Array.from(html.matchAll(/<script\b([^>]*)>/gi), (match) =>
    match[1],
  );
  expect(scriptTags.length, `[${name}] should render scripts`).toBeGreaterThan(0);
  for (const attributes of scriptTags) {
    expect(
      attributes.match(/\bnonce="([^"]+)"/i)?.[1],
      `[${name}] every rendered script must carry the CSP nonce`,
    ).toBe(nonce);
  }
  expect(
    scriptTags.some(
      (attributes) =>
        /\bdata-testid="sw-registration-script"/i.test(attributes) &&
        attributes.includes(`nonce="${nonce}"`),
    ),
    `[${name}] service-worker registration must carry the CSP nonce`,
  ).toBe(true);
  if (name === "/") {
    expect(
      scriptTags.some(
        (attributes) =>
          /\btype="application\/ld\+json"/i.test(attributes) &&
          attributes.includes(`nonce="${nonce}"`),
      ),
      "homepage JSON-LD must carry the CSP nonce",
    ).toBe(true);
  }
  expect(
    csp.includes("frame-ancestors 'none'"),
    `[${name}] CSP must deny framing via frame-ancestors 'none'`,
  ).toBe(true);
  return nonce;
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
      assertNoncePolicyAndScriptParity(route, res, await res.text());
    });
  }

  test("uses a fresh nonce on each request and matches it to rendered scripts", async ({
    request,
    baseURL,
  }) => {
    const first = await request.get(`${baseURL}/`);
    const firstNonce = assertNoncePolicyAndScriptParity(
      "first homepage request",
      first,
      await first.text(),
    );
    const second = await request.get(`${baseURL}/`);
    const secondNonce = assertNoncePolicyAndScriptParity(
      "second homepage request",
      second,
      await second.text(),
    );
    expect(secondNonce).not.toBe(firstNonce);
  });
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
