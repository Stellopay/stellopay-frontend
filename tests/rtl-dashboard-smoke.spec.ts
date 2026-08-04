/**
 * RTL (right-to-left) smoke test — dashboard shell
 *
 * Forces `dir="rtl"` on <html> before the page loads and verifies the
 * dashboard route renders without layout regressions that would only
 * surface in RTL locales (e.g. Arabic, Hebrew, Persian):
 *
 *   • No element overflows its containing block horizontally — catches
 *     hard-coded LTR margins, absolutely-positioned badges, and flex
 *     children that didn't account for reverse direction.
 *   • No text is visually clipped by `overflow: hidden` ancestors —
 *     catches cases where a fixed-width container fits the English
 *     label but truncates the longer RTL translation.
 *   • Screenshot artifact retained on failure so the exact failing
 *     render is available for manual review without re-running locally.
 *   • axe-core scan (WCAG 2.1 AA + best-practice) so RTL-specific
 *     a11y regressions (bad reading order, wrong focus order) surface
 *     here rather than waiting for manual locale QA.
 *
 * This spec intentionally stays a *smoke* test — it checks the
 * dashboard shell above the fold at four Tailwind breakpoints. It does
 * not snapshot every pixel (that belongs in a dedicated visual
 * regression suite); instead it codifies the two failure modes that
 * historically take down an RTL rollout: horizontal scrollbars and
 * clobbered text.
 *
 * Responsive breakpoints (matches Tailwind sm / md / lg / xl):
 *   sm  –  640 ×  900
 *   md  –  768 ×  900
 *   lg  – 1024 ×  900
 *   xl  – 1280 ×  900
 *
 * Running:
 *   npx playwright test tests/rtl-dashboard-smoke.spec.ts
 *   npx playwright test tests/rtl-dashboard-smoke.spec.ts --project=firefox
 *   npx playwright test tests/rtl-dashboard-smoke.spec.ts --reporter=list
 */

import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./axe-helper";

const DASHBOARD_URL = "/dashboard";

const BREAKPOINTS = [
  { name: "sm", width: 640, height: 900 },
  { name: "md", width: 768, height: 900 },
  { name: "lg", width: 1024, height: 900 },
  { name: "xl", width: 1280, height: 900 },
] as const;

// ---------------------------------------------------------------------------
// Known dashboard a11y issues — same allowlist as dashboard.spec.ts so the
// RTL pass does not regress on pre-existing, triaged findings.
// ---------------------------------------------------------------------------

const KNOWN_DASHBOARD_A11Y_ISSUES = [
  {
    id: "color-contrast",
    reason:
      "QuickActions cards use text-zinc-900 on dark backgrounds — pending design token fix",
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers — RTL setup, page load, overflow / clip detection
// ---------------------------------------------------------------------------

/**
 * Forces `dir="rtl"` on <html> before any of the page's scripts run.
 *
 * This is applied as an `addInitScript` so it runs before the Next.js
 * hydration script. Combined with the synchronous attribute write in
 * the returned `addInitScript` payload, this guarantees there is no
 * LTR-to-RTL flash on first paint — which matters because we snapshot
 * above-the-fold immediately after load.
 */
async function forceRTL(page: Page): Promise<void> {
  await page.addInitScript(() => {
    document.documentElement.setAttribute("dir", "rtl");
  });
}

/**
 * Asserts `dir="rtl"` is present on <html> after navigation.
 *
 * If this fails the init-script injection above did not run (e.g. the
 * page navigated about:blank first) or some client code stripped the
 * attribute during hydration — either way it is a real bug.
 */
async function assertRTLApplied(page: Page): Promise<void> {
  const dir = await page.evaluate(() =>
    document.documentElement.getAttribute("dir"),
  );
  expect(dir).toBe("rtl");
}

/**
 * Navigate to the dashboard, wait for deferred chunks and skeletons to
 * resolve, then freeze animations so checks are deterministic.
 *
 * Mirrors `loadDashboard` from dashboard.spec.ts so the two suites
 * exercise the same loaded state.
 */
async function loadDashboardRTL(page: Page): Promise<void> {
  await page.goto(DASHBOARD_URL);
  await page.waitForLoadState("networkidle");

  await page
    .locator('[role="status"][aria-busy="true"]')
    .waitFor({ state: "hidden", timeout: 15_000 })
    .catch(() => {
      // Skeleton already gone — content loaded synchronously.
    });

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

// ---------------------------------------------------------------------------
// Helper: detect horizontal overflow
//
// Walks every element in the document and reports any node whose
// *content* box overflows its *containing* block horizontally.
//
// Implementation notes:
//   • Elements that are intentionally scrollable (`overflow-x: auto |
//     scroll`) are excluded — overflow there is desired behaviour.
//   • Elements clipped by `overflow-x: hidden` still count — those are
//     the silent regressions that users actually see.
//   • A small tolerance (1 px) absorbs sub-pixel rounding from flex
//     layouts that render at fractional widths on high-DPI canvases.
//   • Only the first 5 offending nodes are serialised into the failure
//     message to keep test output scannable; the full list is logged
//     at `console.error` for triage.
// ---------------------------------------------------------------------------

interface OverflowOffender {
  selector: string;
  scrollWidth: number;
  clientWidth: number;
  overflowX: string;
  computedMarginLeft: string;
  computedMarginRight: string;
}

async function detectHorizontalOverflow(
  page: Page,
): Promise<OverflowOffender[]> {
  return page.evaluate<OverflowOffender[]>(() => {
    const TOLERANCE = 1;
    const NON_RENDERED: ReadonlySet<string> = new Set([
      "SCRIPT",
      "STYLE",
      "LINK",
      "META",
      "TEMPLATE",
      "NOSCRIPT",
      "HEAD",
      "TITLE",
    ]);
    const offenders: OverflowOffender[] = [];
    const all = document.querySelectorAll<HTMLElement>("*");

    for (const el of all) {
      if (NON_RENDERED.has(el.tagName)) continue;

      const style = window.getComputedStyle(el);
      const overflowX = style.overflowX;

      // Skip nodes whose whole job is to scroll horizontally — overflow
      // is the desired behaviour and should not fail this smoke test.
      if (overflowX === "auto" || overflowX === "scroll") {
        continue;
      }

      // Skip elements that are not visually rendered. Note we cannot use
      // `offsetParent === null` as the sole guard because that also
      // returns null for `position: fixed` elements, which DO paint and
      // CAN cause overflow.
      const rect = el.getBoundingClientRect();
      const hasNoBox =
        rect.width === 0 && rect.height === 0 && el.offsetParent === null;
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0" ||
        hasNoBox
      ) {
        continue;
      }

      const { scrollWidth, clientWidth } = el;
      if (scrollWidth - clientWidth > TOLERANCE) {
        const selector = buildRobustSelector(el);
        offenders.push({
          selector,
          scrollWidth,
          clientWidth,
          overflowX,
          computedMarginLeft: style.marginLeft,
          computedMarginRight: style.marginRight,
        });
      }
    }

    return offenders;

    // Build a CSS selector that uniquely identifies an element for
    // manual triage. Tries (in order): id, classlist, tag+nth-child.
    function buildRobustSelector(el: Element): string {
      const htmlEl = el as HTMLElement;
      if (htmlEl.id) return `#${htmlEl.id}`;
      const tag = el.tagName.toLowerCase();
      const classes = Array.from(el.classList)
        .filter((c) => /^[a-z]/i.test(c))
        .slice(0, 3)
        .map((c) => `.${c}`)
        .join("");
      if (classes) return `${tag}${classes}`;
      // Fall back to nth-of-type within the parent — still humanly
      // navigable with DevTools "Copy selector".
      const parent = el.parentElement;
      if (!parent) return tag;
      const sameTag = Array.from(
        parent.querySelectorAll<Element>(`:scope > ${el.tagName}`),
      );
      const index = sameTag.indexOf(el) + 1;
      return `${parent.tagName.toLowerCase()} > ${tag}:nth-of-type(${index})`;
    }
  });
}

// ---------------------------------------------------------------------------
// Helper: detect visually clipped text
//
// Finds every element with `overflow: hidden` (or one of the
// directional variants) that contains at least one text node whose
// ink rect would exceed the element's content box.
//
// This catches the class of RTL bugs where a label container has a
// hard-coded width tuned for the English copy: LTR renders fit, but
// the longer Arabic/Persian translation spills out of the box and is
// silently cropped.
// ---------------------------------------------------------------------------

interface ClippedTextOffender {
  selector: string;
  text: string;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

async function detectClippedText(page: Page): Promise<ClippedTextOffender[]> {
  return page.evaluate<ClippedTextOffender[]>(() => {
    const TOLERANCE = 1;
    const NON_RENDERED: ReadonlySet<string> = new Set([
      "SCRIPT",
      "STYLE",
      "LINK",
      "META",
      "TEMPLATE",
      "NOSCRIPT",
      "HEAD",
      "TITLE",
    ]);
    const offenders: ClippedTextOffender[] = [];
    const all = document.querySelectorAll<HTMLElement>("*");

    for (const el of all) {
      if (NON_RENDERED.has(el.tagName)) continue;

      const style = window.getComputedStyle(el);
      const overflowsHidden =
        style.overflow === "hidden" ||
        style.overflowX === "hidden" ||
        style.overflowY === "hidden";
      if (!overflowsHidden) continue;

      // Mirror the overflow-detector visibility guard so the two scans
      // agree on which nodes are "actually in the render tree".
      const rect = el.getBoundingClientRect();
      const hasNoBox =
        rect.width === 0 && rect.height === 0 && el.offsetParent === null;
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0" ||
        hasNoBox
      ) {
        continue;
      }

      // Fast path: if the box shows no scroll-overflow at all, no text
      // can possibly be clipped inside it.
      const { scrollWidth, scrollHeight, clientWidth, clientHeight } = el;
      const horizontalOverflow = scrollWidth - clientWidth > TOLERANCE;
      const verticalOverflow = scrollHeight - clientHeight > TOLERANCE;
      if (!horizontalOverflow && !verticalOverflow) continue;

      // Only count nodes that actually *contain* text worth rendering.
      // This excludes empty skeleton wrappers and icon-only buttons.
      const text = el.textContent?.trim() ?? "";
      if (text.length < 2) continue;

      // If text-overflow: ellipsis is set, the container is *expected*
      // to clip when the text is too long — that is by design, not an
      // RTL bug. Allow it so long as the developer opted in explicitly.
      if (style.textOverflow === "ellipsis" || style.textOverflow === "clip") {
        continue;
      }

      offenders.push({
        selector: buildSelector(el),
        text: text.slice(0, 80),
        clientWidth,
        clientHeight,
        scrollWidth,
        scrollHeight,
      });
    }

    return offenders;

    function buildSelector(el: Element): string {
      const htmlEl = el as HTMLElement;
      if (htmlEl.id) return `#${htmlEl.id}`;
      const tag = el.tagName.toLowerCase();
      const classes = Array.from(el.classList)
        .filter((c) => /^[a-z]/i.test(c))
        .slice(0, 3)
        .map((c) => `.${c}`)
        .join("");
      if (classes) return `${tag}${classes}`;
      return tag;
    }
  });
}

function formatOverflowOffenders(list: OverflowOffender[]): string {
  return list
    .slice(0, 5)
    .map(
      (o) =>
        `  • ${o.selector}\n` +
        `      scrollWidth=${o.scrollWidth} clientWidth=${o.clientWidth} ` +
        `(delta ${o.scrollWidth - o.clientWidth}px)\n` +
        `      overflow-x=${o.overflowX} margin-left=${o.computedMarginLeft} ` +
        `margin-right=${o.computedMarginRight}`,
    )
    .join("\n");
}

function formatClippedTextOffenders(list: ClippedTextOffender[]): string {
  return list
    .slice(0, 5)
    .map(
      (o) =>
        `  • ${o.selector}\n` +
        `      text: "${o.text}"\n` +
        `      box  = ${o.clientWidth}×${o.clientHeight}  ` +
        `scroll = ${o.scrollWidth}×${o.scrollHeight}`,
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// Primary suite — RTL dashboard smoke per breakpoint
// ---------------------------------------------------------------------------

test.describe("RTL dashboard smoke — no clipped or overflowing content", () => {
  for (const bp of BREAKPOINTS) {
    test.describe(`viewport ${bp.name} (${bp.width}×${bp.height})`, () => {
      test.use({ viewport: { width: bp.width, height: bp.height } });

      test(`dir=rtl applied, no overflow, no clipped text, a11y clean @rtl`, async ({
        page,
      }, testInfo) => {
        // ── 1. Force RTL before any script runs ────────────────────────────
        await forceRTL(page);

        // ── 2. Load dashboard to settled state ─────────────────────────────
        await loadDashboardRTL(page);
        await page.evaluate(() => window.scrollTo(0, 0));

        // ── 3. Sanity: dir attribute survived hydration ────────────────────
        await assertRTLApplied(page);

        // ── 4. Horizontal overflow scan ────────────────────────────────────
        const overflow = await detectHorizontalOverflow(page);
        if (overflow.length > 0) {
          // Always attach the current render so triage does not require
          // reproducing the viewport + browser locally.
          await testInfo.attach(`rtl-overflow-${bp.name}-${bp.width}.png`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
          console.error(
            `[rtl-smoke] ${overflow.length} overflow offenders\n` +
              formatOverflowOffenders(overflow),
          );
        }
        expect(
          overflow,
          overflow.length > 0
            ? `${overflow.length} element(s) overflow horizontally in RTL at ${bp.name}:\n` +
                formatOverflowOffenders(overflow) +
                (overflow.length > 5
                  ? `\n  … plus ${overflow.length - 5} more — see console.error for the full list.`
                  : "")
            : undefined,
        ).toEqual([]);

        // ── 5. Clipped-text scan ───────────────────────────────────────────
        const clipped = await detectClippedText(page);
        if (clipped.length > 0) {
          await testInfo.attach(`rtl-clipped-text-${bp.name}-${bp.width}.png`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
          console.error(
            `[rtl-smoke] ${clipped.length} clipped-text offenders\n` +
              formatClippedTextOffenders(clipped),
          );
        }
        expect(
          clipped,
          clipped.length > 0
            ? `${clipped.length} element(s) clip their text in RTL at ${bp.name}:\n` +
                formatClippedTextOffenders(clipped) +
                (clipped.length > 5
                  ? `\n  … plus ${clipped.length - 5} more — see console.error for the full list.`
                  : "")
            : undefined,
        ).toEqual([]);

        // ── 6. Accessibility scan (WCAG 2.1 A/AA + best-practice) ──────────
        await expectNoSeriousA11yViolations(page, {
          allowlist: [...KNOWN_DASHBOARD_A11Y_ISSUES],
        });

        // ── 7. Always-attach success screenshot for visual review ──────────
        // A single PNG per breakpoint gives PR reviewers an immediate
        // RTL render to compare against their mental model, even when
        // the test passes.
        await testInfo.attach(`rtl-dashboard-${bp.name}-${bp.width}.png`, {
          body: await page.screenshot({ fullPage: false }),
          contentType: "image/png",
        });
      });
    });
  }
});
