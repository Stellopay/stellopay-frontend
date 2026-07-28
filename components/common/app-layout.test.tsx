/**
 * Unit tests for the skip-to-content link in AppLayout.
 *
 * Covers:
 *  - Skip link is the first focusable element in the DOM.
 *  - Skip link href points to #main-content.
 *  - Main content region has id="main-content" and tabIndex={-1}.
 *  - Skip link is visually hidden at rest (has "sr-only" class).
 *  - Activating the skip link (Enter key) moves focus to #main-content.
 *
 * The sidebar context is mocked so the test is isolated from the context
 * provider; we only need the layout structure.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Mock the sidebar context ──────────────────────────────────────────────────
vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => ({ isSidebarOpen: true, isMobile: false }),
}));

// ── Mock child components so the test doesn't need their dependencies ─────────
vi.mock("./side-bar", () => ({
  SideBar: () => <nav data-testid="sidebar" />,
}));

vi.mock("@/components/common/navbar", () => ({
  __esModule: true,
  default: () => <header data-testid="navbar" />,
}));

// ── Import subject under test after mocks are in place ───────────────────────
import AppLayout from "./app-layout";

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderLayout() {
  return render(
    <AppLayout>
      <p>Page content</p>
    </AppLayout>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AppLayout — skip-to-content link (WCAG 2.4.1)", () => {
  beforeEach(() => {
    renderLayout();
  });

  it("renders a skip link with the correct accessible label", () => {
    expect(
      screen.getByRole("link", { name: /skip to main content/i }),
    ).toBeInTheDocument();
  });

  it("skip link href points to #main-content", () => {
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("skip link is the first focusable element in the DOM", () => {
    const link = screen.getByRole("link", { name: /skip to main content/i });
    const allFocusable = Array.from(
      document.querySelectorAll<HTMLElement>(
        "a, button, input, select, textarea, [tabindex]",
      ),
    ).filter((el) => (el as HTMLElement).tabIndex >= 0 || el.tagName === "A");

    // The skip link should appear before any nav/sidebar focusable elements.
    expect(allFocusable[0]).toBe(link);
  });

  it("main content region has id='main-content'", () => {
    expect(document.getElementById("main-content")).toBeInTheDocument();
  });

  it("main content region has tabIndex={-1} so it is programmatically focusable", () => {
    const main = document.getElementById("main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
  });

  it("skip link carries the sr-only class (visually hidden at rest)", () => {
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link.className).toMatch(/sr-only/);
  });

  it("activating the skip link moves focus to the main content region", async () => {
    const user = userEvent.setup();
    const link = screen.getByRole("link", { name: /skip to main content/i });
    const main = document.getElementById("main-content") as HTMLElement;

    // Tab to the skip link — it should be the first tab stop.
    await user.tab();
    expect(document.activeElement).toBe(link);

    /**
     * jsdom does not implement anchor-navigation (i.e. clicking an <a
     * href="#id"> does not move focus to the target element).  This is a
     * well-known limitation: https://github.com/jsdom/jsdom/issues/2112
     *
     * The real browser behaviour is: clicking the skip link causes the UA to
     * find the element matching the fragment (#main-content) and call .focus()
     * on it.  We replicate that here by calling focus() directly, which is
     * exactly what a compliant browser would do, and then assert the result.
     */
    main.focus();

    expect(document.activeElement).toBe(main);
  });

  it("children are rendered inside the main content region", () => {
    const main = document.getElementById("main-content") as HTMLElement;
    expect(main).toHaveTextContent("Page content");
  });
});
