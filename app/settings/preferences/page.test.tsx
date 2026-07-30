/**
 * Tests for app/settings/preferences/page.tsx
 *
 * The page is an async React Server Component — it is called as a plain async
 * function and its JSX output is rendered under jsdom.  The SettingsPageShell
 * it renders is mocked to a lightweight stub so these tests stay focused on
 * the page's own responsibilities:
 *
 *   1. Resolving `searchParams` (which is an async Promise in Next.js 15).
 *   2. Unwrapping the `section` value (scalar string, array, or missing).
 *   3. Passing the correct `initialSection` prop down to the shell.
 *   4. Falling back to `undefined` (which the shell normalises to "account")
 *      when `searchParams` is absent or the key is missing.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import SettingsPage from "./page";

// ---------------------------------------------------------------------------
// Stub SettingsPageShell so we don't have to set up next/navigation mocks or
// render the full client-side shell.  The stub records the `initialSection`
// prop as a data attribute so assertions stay simple.
// ---------------------------------------------------------------------------
vi.mock("./components/settings-page-shell", () => ({
  default: ({ initialSection }: { initialSection?: string }) => (
    <div
      data-testid="settings-page-shell"
      data-initial-section={initialSection ?? "__undefined__"}
    >
      Settings shell
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders the async server component and returns the rendered container.
 * `searchParams` mirrors the type used by Next.js 15 App Router: a Promise
 * that resolves to the query-string object.
 */
async function renderPage(
  searchParams?: Promise<Record<string, string | string[] | undefined>>,
) {
  const jsx = await SettingsPage({ searchParams });
  return render(jsx as React.ReactElement);
}

function getShell() {
  return screen.getByTestId("settings-page-shell");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SettingsPage — searchParams resolution", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the SettingsPageShell when called with no searchParams", async () => {
    await renderPage();
    expect(getShell()).toBeInTheDocument();
  });

  it("passes undefined as initialSection when searchParams is not provided", async () => {
    await renderPage();
    expect(getShell()).toHaveAttribute("data-initial-section", "__undefined__");
  });

  it("passes undefined as initialSection when searchParams resolves to an empty object", async () => {
    await renderPage(Promise.resolve({}));
    expect(getShell()).toHaveAttribute("data-initial-section", "__undefined__");
  });

  it("passes the section string directly when searchParams contains a scalar value", async () => {
    await renderPage(Promise.resolve({ section: "security" }));
    expect(getShell()).toHaveAttribute("data-initial-section", "security");
  });

  it("passes the first element when searchParams.section is an array", async () => {
    await renderPage(Promise.resolve({ section: ["wallets", "account"] }));
    expect(getShell()).toHaveAttribute("data-initial-section", "wallets");
  });

  it("passes undefined when searchParams.section is an empty array", async () => {
    // An empty array has no first element — resolves to undefined.
    await renderPage(Promise.resolve({ section: [] }));
    expect(getShell()).toHaveAttribute("data-initial-section", "__undefined__");
  });

  it("passes the section value for every valid tab name", async () => {
    const validSections = [
      "account",
      "notifications",
      "security",
      "wallets",
      "documents",
    ];

    for (const section of validSections) {
      const { unmount } = await renderPage(Promise.resolve({ section }));
      expect(getShell()).toHaveAttribute("data-initial-section", section);
      unmount();
    }
  });

  it("passes an unrecognised section string through to the shell (the shell normalises it)", async () => {
    // The page itself does not validate the section value — it just unwraps it.
    // The shell is responsible for falling back to "account" for unknown values.
    await renderPage(Promise.resolve({ section: "unknown-tab" }));
    expect(getShell()).toHaveAttribute(
      "data-initial-section",
      "unknown-tab",
    );
  });

  it("ignores unrelated query-string keys and resolves section correctly", async () => {
    await renderPage(
      Promise.resolve({ ref: "email-campaign", section: "notifications" }),
    );
    expect(getShell()).toHaveAttribute("data-initial-section", "notifications");
  });

  it("handles a rejected searchParams promise gracefully (propagates the error)", async () => {
    // The page awaits searchParams directly — a rejection bubbles up as an
    // unhandled error, which Next.js' error boundary catches in production.
    await expect(
      renderPage(Promise.reject(new Error("searchParams read error"))),
    ).rejects.toThrow("searchParams read error");
  });
});

// ---------------------------------------------------------------------------
// Tab-structure tests
//
// These tests exercise the CONTRACT between page.tsx and SettingsPageShell:
// every valid section value defined in the settings IA spec must be passed
// through correctly so the shell can activate the right tab.
// ---------------------------------------------------------------------------

/**
 * Canonical set of section values defined in design/settings-ia.md.
 * Keep this list in sync with buildSections() in settings-page-shell.tsx and
 * the tab table at the top of the spec.
 */
const VALID_SECTIONS = [
  "account",
  "notifications",
  "security",
  "wallets",
  "documents",
] as const;

describe("SettingsPage — tab structure (settings IA contract)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defines exactly five canonical section values in the spec", () => {
    // If this count changes, the README and design/settings-ia.md must be
    // updated too — this test makes that drift visible immediately.
    expect(VALID_SECTIONS).toHaveLength(5);
  });

  it.each(VALID_SECTIONS)(
    "passes '%s' section value through to the shell unchanged",
    async (section) => {
      const { unmount } = await renderPage(Promise.resolve({ section }));
      expect(getShell()).toHaveAttribute("data-initial-section", section);
      unmount();
    },
  );

  it("passes the 'documents' tab value (Statements / tax-documents section)", async () => {
    // Explicit test for the documents tab introduced alongside
    // tax-documents-section.tsx to prevent accidental renames.
    await renderPage(Promise.resolve({ section: "documents" }));
    expect(getShell()).toHaveAttribute("data-initial-section", "documents");
  });

  it("passes an unknown section string through — shell is responsible for fallback to 'account'", async () => {
    // page.tsx deliberately does not validate the value; the shell owns
    // the fallback logic (unknown → "account").
    await renderPage(Promise.resolve({ section: "does-not-exist" }));
    expect(getShell()).toHaveAttribute(
      "data-initial-section",
      "does-not-exist",
    );
  });

  it("passes undefined when section param is absent — shell falls back to 'account'", async () => {
    await renderPage(Promise.resolve({}));
    expect(getShell()).toHaveAttribute("data-initial-section", "__undefined__");
  });

  it("does not pass 'account' as a default — the shell owns the default", async () => {
    // This assertion documents the intentional design: the page is a thin
    // pass-through and must not silently substitute "account" for a missing
    // param. That would mask bugs where the shell's own default logic breaks.
    await renderPage(Promise.resolve({}));
    // undefined is encoded as __undefined__ by the stub — NOT "account".
    expect(getShell()).not.toHaveAttribute("data-initial-section", "account");
  });
});
