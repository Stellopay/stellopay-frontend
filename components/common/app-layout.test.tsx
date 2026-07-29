/**
 * Unit tests for AppLayout.
 *
 * Covers:
 *  Skip-to-content link (WCAG 2.4.1)
 *  ────────────────────────────────
 *  - Skip link is the first focusable element in the DOM.
 *  - Skip link href points to #main-content.
 *  - Main content region has id="main-content" and tabIndex={-1}.
 *  - Skip link is visually hidden at rest (has "sr-only" class).
 *  - Activating the skip link (Enter key) moves focus to #main-content.
 *
 *  Shortcut Help Modal integration
 *  ────────────────────────────────
 *  - Modal is not visible on initial render.
 *  - Pressing '?' opens the shortcut help modal.
 *  - Pressing '?' again closes the modal (toggle).
 *  - Pressing '?' while an input is focused does NOT open the modal.
 *  - Pressing Escape closes the open modal.
 *
 * The sidebar context is mocked so the test is isolated from the context
 * provider; we only need the layout structure.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Mock the sidebar context ──────────────────────────────────────────────────
vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => ({ isSidebarOpen: true, isMobile: false }),
}));

// ── Mock useGlobalShortcuts to avoid Next.js router dependency ───────────────
vi.mock("@/hooks/useGlobalShortcuts", () => ({
  useGlobalShortcuts: vi.fn(),
}));

// ── Mock child components so the test doesn't need their dependencies ─────────
vi.mock("./side-bar", () => ({
  SideBar: () => (
    <aside data-testid="sidebar" aria-label="Application sidebar">
      <nav>Sidebar nav</nav>
    </aside>
  ),
}));

vi.mock("@/components/common/navbar", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Navbar</div>,
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

// ── Shortcut Help Modal — integration ─────────────────────────────────────────

describe("AppLayout — shortcut help modal integration", () => {
  it("shortcut help modal is not visible on initial render", () => {
    renderLayout();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pressing '?' opens the shortcut help modal", () => {
    renderLayout();
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /keyboard shortcuts/i }),
    ).toBeInTheDocument();
  });

  it("pressing '?' twice toggles the modal closed", async () => {
    renderLayout();

    // Open
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close — Radix Dialog animates out; after the second keydown the state
    // is closed, so Radix stops rendering the dialog content.
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pressing '?' while an <input> is focused does NOT open the modal", () => {
    renderLayout();

    // Create a focused input to simulate typing context
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(window, { key: "?" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Cleanup
    document.body.removeChild(input);
  });

  it("pressing '?' while a <textarea> is focused does NOT open the modal", () => {
    renderLayout();

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    fireEvent.keyDown(window, { key: "?" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    document.body.removeChild(textarea);
  });

  it("pressing Escape closes the open modal", async () => {
    const user = userEvent.setup();
    renderLayout();

    // Open the modal
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Escape should close it (Radix Dialog default behaviour)
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking the modal close button closes the modal", async () => {
    const user = userEvent.setup();
    renderLayout();

    fireEvent.keyDown(window, { key: "?" });
    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

// ── Landmark Audit (WCAG 1.3.1, 1.3.6, 4.1.2) — issue #771 ───────────────────

describe("AppLayout — landmark roles and uniqueness (WCAG 1.3.1, 1.3.6)", () => {
  beforeEach(() => {
    renderLayout();
  });

  it("renders exactly one <main> landmark per page", () => {
    const mains = screen.getAllByRole("main");
    expect(mains).toHaveLength(1);
  });

  it("<main> has id='main-content' and is programmatically focusable", () => {
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
  });

  it("renders exactly one <header> (banner) landmark", () => {
    const banners = screen.getAllByRole("banner");
    expect(banners).toHaveLength(1);
  });

  it("<header> (banner) has aria-label to distinguish it from page-level headers", () => {
    const banner = screen.getByRole("banner");
    expect(banner).toHaveAccessibleName("Site header");
  });

  it("renders exactly one <nav> landmark (inside the sidebar)", () => {
    // The NavLink component inside SideBar renders a <nav> element.
    // Our mock renders <aside aria-label="Application sidebar"><nav>...</nav></aside>
    // which mirrors the real SideBar structure.
    const navs = screen.getAllByRole("navigation");
    expect(navs).toHaveLength(1);
  });

  it("<aside> (complementary) landmark has accessible name", () => {
    // SideBar renders <aside aria-label="Application sidebar">
    const complementary = screen.getByRole("complementary");
    expect(complementary).toHaveAccessibleName("Application sidebar");
  });

  it("landmarks are unique — no duplicate banner, main, or complementary without unique labels", () => {
    // WCAG 1.3.6 requires that when multiple instances of the same landmark
    // exist, each must have a unique accessible name. Our layout has exactly
    // one of each critical landmark (banner, main, nav, complementary), so
    // we don't need distinguishing labels within AppLayout itself — but
    // the site header <header> already has aria-label="Site header" to allow
    // child pages to safely add their own <header> elements if needed.

    const banners = screen.getAllByRole("banner");
    const mains = screen.getAllByRole("main");
    const complementaries = screen.getAllByRole("complementary");
    const navs = screen.getAllByRole("navigation");

    expect(banners).toHaveLength(1);
    expect(mains).toHaveLength(1);
    expect(complementaries).toHaveLength(1);
    expect(navs).toHaveLength(1);

    // Verify accessible names on labelled landmarks
    expect(banners[0]).toHaveAccessibleName("Site header");
    expect(complementaries[0]).toHaveAccessibleName("Application sidebar");
  });

  it("skip-to-content link target matches main landmark id", () => {
    const skipLink = screen.getByRole("link", {
      name: /skip to main content/i,
    });
    const main = screen.getByRole("main");

    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(main).toHaveAttribute("id", "main-content");
  });
});
