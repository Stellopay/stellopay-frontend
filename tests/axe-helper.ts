import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";
import { expect, type Page } from "@playwright/test";

/**
 * axe-core impact levels, ordered from least to most severe.
 * @see https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#impact
 */
export type AxeImpact = "minor" | "moderate" | "serious" | "critical";

/** Impact levels that fail a test when not explicitly triaged. */
const BLOCKING_IMPACTS: AxeImpact[] = ["serious", "critical"];

/** WCAG 2.x A/AA rules plus axe's curated best-practice set. */
const DEFAULT_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "best-practice",
];

/**
 * A known accessibility issue that has been triaged and intentionally
 * allowlisted instead of fixed immediately. Every entry must carry a
 * `reason` (ideally with a tracking issue link) so the allowlist stays
 * reviewable — this is meant for a handful of known issues, not a way to
 * silence the scan wholesale.
 */
export interface TriagedViolation {
  /** axe-core rule id, e.g. "color-contrast". */
  id: string;
  /** Why this is allowlisted rather than fixed (link a tracking issue). */
  reason: string;
}

export interface RunAxeScanOptions {
  /** Restrict the scan to these CSS selectors instead of the full page. */
  include?: string[];
  /** Exclude these CSS selectors from the scan (e.g. third-party widgets). */
  exclude?: string[];
  /** axe-core tags to check. Defaults to {@link DEFAULT_TAGS}. */
  tags?: string[];
  /** Known, triaged violations to allow without failing the test. */
  allowlist?: TriagedViolation[];
}

function formatViolation(violation: Result): string {
  const targets = violation.nodes
    .slice(0, 3)
    .map((node) => node.target.join(" "))
    .join(", ");
  return `  [${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help} (${violation.nodes.length} node(s): ${targets}) — ${violation.helpUrl}`;
}

/**
 * Runs an axe-core scan against the current page and returns the raw results.
 *
 * Prefer {@link expectNoSeriousA11yViolations} in tests — this is exposed
 * for callers that need the full result set (e.g. to log moderate findings).
 */
export async function runAxeScan(page: Page, options: RunAxeScanOptions = {}) {
  let builder = new AxeBuilder({ page }).withTags(options.tags ?? DEFAULT_TAGS);

  for (const selector of options.include ?? []) {
    builder = builder.include(selector);
  }
  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }

  return builder.analyze();
}

/**
 * Scans the current page with axe-core and fails the test if any *serious*
 * or *critical* violation is found, unless its rule id appears in
 * `options.allowlist`.
 *
 * Violations below the failing threshold (minor/moderate) and allowlisted
 * violations are still reported via `console.warn` so they stay visible
 * without breaking CI — only unaddressed serious/critical issues fail.
 *
 * @example
 * ```ts
 * await page.goto("/auth/login");
 * await expectNoSeriousA11yViolations(page);
 * ```
 */
export async function expectNoSeriousA11yViolations(
  page: Page,
  options: RunAxeScanOptions = {},
): Promise<void> {
  const results = await runAxeScan(page, options);
  const allowlist = options.allowlist ?? [];
  const allowlistedIds = new Set(allowlist.map((entry) => entry.id));

  const blocking = results.violations.filter(
    (violation) =>
      BLOCKING_IMPACTS.includes(violation.impact as AxeImpact) &&
      !allowlistedIds.has(violation.id),
  );
  const nonBlocking = results.violations.filter(
    (violation) => !blocking.includes(violation),
  );

  if (nonBlocking.length > 0) {
    const allowlistedNote = (id: string) => {
      const entry = allowlist.find((e) => e.id === id);
      return entry ? ` (triaged: ${entry.reason})` : "";
    };
    console.warn(
      `[axe] ${nonBlocking.length} non-blocking violation(s) on ${page.url()}:\n` +
        nonBlocking
          .map((v) => formatViolation(v) + allowlistedNote(v.id))
          .join("\n"),
    );
  }

  expect(
    blocking,
    blocking.length > 0
      ? `Accessibility violations found on ${page.url()}:\n${blocking
          .map(formatViolation)
          .join("\n")}`
      : undefined,
  ).toEqual([]);
}
