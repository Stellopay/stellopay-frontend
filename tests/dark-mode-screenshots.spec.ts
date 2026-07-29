/**
 * Dark-mode screenshot audit
 *
 * Visits every top-level route with dark mode forced via the localStorage
 * injection pattern (`theme: "dark"`), which the ThemeProvider reads on mount
 * and translates into a `dark` class on `<html>`. This is the same mechanism
 * used in `tests/theme.spec.ts` and is proven to be reliable without any
 * changes to the production code.
 *
 * Purpose:
 *   Each test captures a full-page screenshot artifact that can be diff'd
 *   manually (or with snapshot tooling) to catch visual regressions in dark
 *   mode. Screenshots are written to `test-results/` alongside the other
 *   Playwright artefacts and are retained as CI artefacts on failure.
 *
 * Accessibility:
 *   Each route is also scanned with axe-core (WCAG 2.1 AA + best-practice)
 *   immediately after dark mode is applied, so contrast and ARIA regressions
 *   specific to dark-mode tokens surface here rather than relying on a
 *   separate light-mode pass.
 *
 * Responsive viewports:
 *   Every route is verified at four breakpoints that match the Tailwind
 *   breakpoint system used in the codebase:
 *     sm  – 640 × 900
 *     md  – 768 × 1024
 *     lg  – 1024 × 768
 *     xl  – 1280 × 800
 *
 * Running:
 *   npm run test:e2e                              # chromium only (CI default)
 *   npx playwright test tests/dark-mode-screenshots.spec.ts
 *   npx playwright test tests/dark-mode-screenshots.spec.ts --project=firefox
 */

import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./axe-helper";

// ---------------------------------------------------------------------------
// Route registry
// ---------------------------------------------------------------------------

/**
 * Each entry describes one top-level route to audit.
 *
 * `waitFor` is an optional callback that blocks the screenshot until the UI
 * has settled (e.g. a dynamic heading or a chart container becomes visible).
 * Without it the test falls back to `networkidle`, which is sufficient for
 * most SSR/static routes.
 */
interface RouteConfig {
  /** Human-readable label used in test names and screenshot filenames. */
  label: string;
  /** Absolute path, e.g. "/dashboard". */
  path: string;
  /**
   * Optional predicate executed after navigation. Resolves when the page is
   * considered ready for screenshot and a11y scanning.
   */
  waitFor?: (page: Page) => Promise<void>;
}

const ROUTES: RouteConfig[] = [
  {
    label: "landing",
    path: "/",
    waitFor: async (page) => {
      // The hero landmark renders synchronously; wait for it to be visible so
      // above-the-fold content is fully painted before the screenshot.
      await page.getByRole("region", { name: /hero/i }).waitFor({ state: "visible" });
    },
  },
  {
    label: "dashboard",
    path: "/dashboard",
    waitFor: async (page) => {
      // The analytics widgets behind dynamic imports take ~1.5 s to resolve;
      // networkidle ensures the deferred chunks have settled.
      await page.waitForLoadState("networkidle");
    },
  },
  {
    label: "transactions",
    path: "/transactions",
    waitFor: async (page) => {
      await page.waitForLoadState("networkidle");
    },
  },
  {
    label: "settings-preferences",
    path: "/settings/preferences",
    waitFor: async (page) => {
      await page.waitForLoadState("networkidle");
    },
  },
  {
    label: "help-support",
    path: "/help/support",
    waitFor: async (page) => {
      await page.waitForLoadState("networkidle");
    },
  },
  {
    label: "account-summary",
    path: "/account-summary",
    waitFor: async (page) => {
      await page.waitForLoadState("networkidle");
    },
  },
  {
    label: "analytics-view",
    path: "/analytics-view",
    waitFor: async (page) => {
      // The recharts bundle is code-split; wait for it to hydrate.
      await page.waitForLoadState("networkidle");
    },
  },
  {
    label: "auth-login",
    path: "/auth/login",
    waitFor: async (page) => {
      // Auth forms are SSR'd; the heading is a reliable ready signal.
      await page
        .getByRole("heading", { level: 1 })
        .waitFor({ state: "visible" });
    },
  },
  {
    label: "auth-sign-up",
    path: "/auth/sign-up",
    waitFor: async (page) => {
      await page
        .getByRole("heading", { level: 1 })
        .waitFor({ state: "visible" });
    },
  },
];

// ---------------------------------------------------------------------------
// Responsive breakpoints (matches Tailwind sm / md / lg / xl)
// ---------------------------------------------------------------------------

const VIEWPORTS = [
  { label: "sm", width: 640, height: 900 },
  { label: "md", width: 768, height: 1024 },
  { label: "lg", width: 1024, height: 768 },
  { label: "xl", width: 1280, height: 800 },
] as const;

// ---------------------------------------------------------------------------
// Helper: inject dark mode before any scripts run
// ---------------------------------------------------------------------------

/**
 * Registers an `addInitScript` that sets `theme: "dark"` in localStorage
 * before the page's own scripts execute. Combined with `emulateMedia`, this
 * guarantees the `dark` class is applied both by the pre-hydration inline
 * script in `app/layout.tsx` and by `ThemeProvider`'s `useEffect` on mount.
 */
async function forceDarkMode(page: Page): Promise<void> {
  // 1. Make the OS colour scheme report dark so the pre-hydration script in
  //    app/layout.tsx applies the `dark` class before React hydrates.
  await page.emulateMedia({ colorScheme: "dark" });

  // 2. Persist the explicit preference so ThemeProvider's useEffect does not
  //    override the class on mount (it reads `getStoredTheme()` → "dark").
  await page.addInitScript(() => {
    window.localStorage.setItem("theme", "dark");
  });
}

/**
 * Asserts that the `dark` class is present on `<html>` after navigation,
 * confirming the ThemeProvider applied the stored preference.
 */
async function assertDarkClassApplied(page: Page): Promise<void> {
  const isDark = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  );
  expect(isDark).toBe(true);
}

// ---------------------------------------------------------------------------
// Test suite — full-page screenshots at desktop width
// ---------------------------------------------------------------------------

test.describe("Dark-mode screenshot audit — desktop (1280 × 800)", () => {
  // Use a single desktop viewport for the primary screenshot pass so the
  // artefacts are easy to compare side-by-side.
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const route of ROUTES) {
    test(`${route.label}: dark mode renders and screenshot captured`, async ({
      page,
    }) => {
      // ── 1. Force dark mode ──────────────────────────────────────────────
      await forceDarkMode(page);

      // ── 2. Navigate ─────────────────────────────────────────────────────
      await page.goto(route.path);

      // ── 3. Wait for content to settle ──────────────────────────────────
      if (route.waitFor) {
        await route.waitFor(page);
      } else {
        await page.waitForLoadState("networkidle");
      }

      // ── 4. Assert dark class ────────────────────────────────────────────
      await assertDarkClassApplied(page);

      // ── 5. Accessibility scan in dark mode ──────────────────────────────
      // Run axe-core against WCAG 2.1 A/AA in the dark-mode render so
      // contrast and ARIA regressions surface here.
      await expectNoSeriousA11yViolations(page);

      // ── 6. Full-page screenshot ─────────────────────────────────────────
      // `toHaveScreenshot` produces a deterministic file name derived from the
      // test title + project name, stored under test-results/. On first run it
      // writes a baseline; subsequent runs diff against it. Pass
      // --update-snapshots to adopt new baselines.
      await expect(page).toHaveScreenshot(`dark-${route.label}-desktop.png`, {
        fullPage: true,
        // Allow minor sub-pixel anti-aliasing differences between runs.
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Test suite — responsive viewports
// ---------------------------------------------------------------------------

test.describe("Dark-mode screenshot audit — responsive breakpoints", () => {
  for (const vp of VIEWPORTS) {
    test.describe(`viewport ${vp.label} (${vp.width}×${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of ROUTES) {
        test(`${route.label}: dark mode renders at ${vp.label}`, async ({
          page,
        }) => {
          await forceDarkMode(page);
          await page.goto(route.path);

          if (route.waitFor) {
            await route.waitFor(page);
          } else {
            await page.waitForLoadState("networkidle");
          }

          await assertDarkClassApplied(page);

          // Screenshot per route + viewport so each breakpoint is reviewable
          // independently.
          await expect(page).toHaveScreenshot(
            `dark-${route.label}-${vp.label}.png`,
            {
              fullPage: true,
              maxDiffPixelRatio: 0.02,
              animations: "disabled",
            },
          );
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Test suite — dark / light parity check
// ---------------------------------------------------------------------------

test.describe("Dark-mode screenshot audit — dark/light parity", () => {
  /**
   * This suite verifies two things that are easy to miss in a pure dark-mode
   * pass:
   *
   * 1. The same route renders *differently* in dark vs light — so we can
   *    catch cases where the dark class was never applied (identical renders
   *    would mean the theme switch silently failed).
   * 2. Navigating from a dark-mode session to a light-mode session removes the
   *    `dark` class (no bleed-over).
   *
   * We pick the landing page and the dashboard as the representative routes
   * because they carry the widest variety of dark-mode tokens.
   */
  test.use({ viewport: { width: 1280, height: 800 } });

  const PARITY_ROUTES: RouteConfig[] = [
    ROUTES.find((r) => r.label === "landing")!,
    ROUTES.find((r) => r.label === "dashboard")!,
  ];

  for (const route of PARITY_ROUTES) {
    test(`${route.label}: dark and light renders differ (theme toggle works)`, async ({
      page,
    }) => {
      // ── Dark render ─────────────────────────────────────────────────────
      await page.emulateMedia({ colorScheme: "dark" });
      await page.addInitScript(() => {
        window.localStorage.setItem("theme", "dark");
      });
      await page.goto(route.path);
      if (route.waitFor) {
        await route.waitFor(page);
      } else {
        await page.waitForLoadState("networkidle");
      }

      const darkBodyBg = await page.evaluate(() =>
        window.getComputedStyle(document.body).backgroundColor,
      );
      const hasDarkClass = await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
      );
      expect(hasDarkClass).toBe(true);

      // ── Light render (new page context, no init script) ─────────────────
      // Navigate to a blank page first to reset state, then inject light.
      await page.evaluate(() => window.localStorage.setItem("theme", "light"));
      await page.emulateMedia({ colorScheme: "light" });
      await page.goto(route.path);
      if (route.waitFor) {
        await route.waitFor(page);
      } else {
        await page.waitForLoadState("networkidle");
      }

      const lightBodyBg = await page.evaluate(() =>
        window.getComputedStyle(document.body).backgroundColor,
      );
      const hasNoDarkClass = await page.evaluate(
        () => !document.documentElement.classList.contains("dark"),
      );
      expect(hasNoDarkClass).toBe(true);

      // The two background colours must differ — if they are equal the dark
      // class was either never applied or the tokens resolve to identical values.
      expect(darkBodyBg).not.toBe(lightBodyBg);
    });
  }
});
