/**
 * Accessibility gate — landing page, help/support, and settings/preferences.
 *
 * Each route is scanned with axe-core for WCAG 2.x A/AA + best-practice
 * violations across desktop, mobile, and (where relevant) dark-mode
 * colour-scheme. Only *serious* and *critical* violations fail the test;
 * minor/moderate findings are logged as console warnings so they stay
 * visible without blocking CI.
 *
 * See {@link KNOWN_EXCEPTIONS} for the documented allowlist of triaged
 * violations that have been intentionally deferred pending a fix.
 *
 * @see tests/axe-helper.ts  — shared helper that drives the gate logic
 * @see .github/workflows/ci.yml  — `a11y-gate` job that runs this file
 */

import { test } from "@playwright/test";
import {
  expectNoSeriousA11yViolations,
  type TriagedViolation,
} from "./axe-helper";

// ---------------------------------------------------------------------------
// Exceptions list
// ---------------------------------------------------------------------------

/**
 * Known accessibility violations that have been triaged and intentionally
 * allowlisted pending a fix.
 *
 * **Guidelines for adding an entry:**
 * - Provide a `reason` that explains *why* it is deferred and, ideally,
 *   links to a tracking issue (e.g. "Design token update pending — #456").
 * - Keep this list as short as possible; it is meant for genuine blockers,
 *   not a way to silence the gate wholesale.
 * - Remove the entry once the underlying issue is resolved.
 *
 * @example
 * ```ts
 * {
 *   id: "color-contrast",
 *   reason: "Hero gradient pending design token update — #123",
 * }
 * ```
 */
const KNOWN_EXCEPTIONS: TriagedViolation[] = [
  // No exceptions at this time. Add entries here only after triage.
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Standard mobile viewport matching an iPhone 14 / most 390 px devices. */
const MOBILE_VIEWPORT = { width: 390, height: 844 };

// ---------------------------------------------------------------------------
// Landing page  /
// ---------------------------------------------------------------------------

test.describe("Landing page (/)", () => {
  test("has no serious or critical a11y violations — desktop", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — dark colour scheme", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });
});

// ---------------------------------------------------------------------------
// Help & Support  /help/support
// ---------------------------------------------------------------------------

test.describe("Help & Support page (/help/support)", () => {
  test("has no serious or critical a11y violations — desktop", async ({
    page,
  }) => {
    await page.goto("/help/support");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/help/support");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — dark colour scheme", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/help/support");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });
});

// ---------------------------------------------------------------------------
// Settings preferences  /settings/preferences
// ---------------------------------------------------------------------------

test.describe("Settings preferences (/settings/preferences)", () => {
  test("has no serious or critical a11y violations — account tab", async ({
    page,
  }) => {
    await page.goto("/settings/preferences?section=account");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — notifications tab", async ({
    page,
  }) => {
    await page.goto("/settings/preferences?section=notifications");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — wallets tab", async ({
    page,
  }) => {
    await page.goto("/settings/preferences?section=wallets");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — security tab", async ({
    page,
  }) => {
    await page.goto("/settings/preferences?section=security");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/settings/preferences");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });

  test("has no serious or critical a11y violations — dark colour scheme", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/settings/preferences");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page, { allowlist: KNOWN_EXCEPTIONS });
  });
});
