/**
 * Tests for the focus-trap in the mobile menu overlay of
 * components/landing/navbar.tsx.
 *
 * Covers:
 * - Drawer opens / closes via the toggle button.
 * - While the drawer is open, Tab / Shift+Tab cycles only within it.
 * - Escape closes the drawer and returns focus to the trigger button.
 * - Focus returns to the trigger button when the drawer closes.
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Navbar from "./navbar";

// ── Mock external dependencies ────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

vi.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("@/components/common/network-switcher", () => ({
  default: () => <div data-testid="network-switcher" />,
}));

vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMenuButton() {
  return screen.getByRole("button", { name: /open menu|close menu/i });
}

function openMenu() {
  fireEvent.click(getMenuButton());
}

function getDrawer() {
  return screen.queryByRole("dialog", { name: /mobile navigation menu/i });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Navbar mobile menu focus trap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the toggle button and the drawer is initially closed", () => {
    render(<Navbar />);
    expect(getMenuButton()).toBeInTheDocument();
    expect(getDrawer()).toBeNull();
  });

  it("opens the drawer when the toggle button is clicked", () => {
    render(<Navbar />);
    openMenu();
    expect(getDrawer()).toBeInTheDocument();
    expect(getMenuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the drawer when the toggle button is clicked again", () => {
    render(<Navbar />);
    openMenu();
    fireEvent.click(getMenuButton()); // close
    expect(getDrawer()).toBeNull();
    expect(getMenuButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the drawer when Escape is pressed", () => {
    render(<Navbar />);
    openMenu();
    expect(getDrawer()).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(getDrawer()).toBeNull();
  });

  it("drawer has aria-modal=true while open", () => {
    render(<Navbar />);
    openMenu();
    const drawer = getDrawer();
    expect(drawer).toHaveAttribute("aria-modal", "true");
  });

  it("Tab wraps from last focusable element to first inside the drawer", () => {
    render(<Navbar />);
    openMenu();

    const drawer = getDrawer()!;
    const focusableEls = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    );

    expect(focusableEls.length).toBeGreaterThan(1);

    const last = focusableEls[focusableEls.length - 1];
    const first = focusableEls[0];

    act(() => last.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });

    expect(document.activeElement).toBe(first);
  });

  it("Shift+Tab wraps from first focusable element to last inside the drawer", () => {
    render(<Navbar />);
    openMenu();

    const drawer = getDrawer()!;
    const focusableEls = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    );

    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

    act(() => first.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it("focus returns to the trigger button after closing via Escape", () => {
    render(<Navbar />);
    const btn = getMenuButton();

    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(btn);
  });

  it("focus returns to the trigger button after closing via button click", () => {
    render(<Navbar />);
    const btn = getMenuButton();

    openMenu();
    fireEvent.click(btn); // close

    expect(document.activeElement).toBe(btn);
  });
});
