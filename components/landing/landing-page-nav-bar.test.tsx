/**
 * Tests for the focus-trap in the slide-in mobile drawer of
 * components/landing/landing-page-nav-bar.tsx.
 *
 * Covers:
 * - Drawer opens / closes via the hamburger toggle button
 * - Slide-in drawer has correct ARIA attributes (aria-modal, role="dialog")
 * - While the drawer is open, Tab / Shift+Tab cycles only within it
 * - Escape closes the drawer and returns focus to the trigger button
 * - Focus returns to the trigger button when the drawer closes
 * - Drawer closes on route change (usePathname change)
 * - Drawer closes on outside click (overlay click)
 * - Body scroll is locked when drawer is open
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LandingPageNavBar from "./landing-page-nav-bar";

// ── Mock external dependencies ────────────────────────────────────────────────

const mockUsePathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/common/network-switcher", () => ({
  default: () => <div data-testid="network-switcher" />,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMenuButton() {
  return screen.getByRole("button", { name: /open navigation menu|close navigation menu/i });
}

function openMenu() {
  fireEvent.click(getMenuButton());
}

function getDrawer() {
  return screen.queryByRole("dialog", { name: /mobile navigation menu/i });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("LandingPageNavBar mobile menu focus trap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders the toggle button and the drawer is initially closed", () => {
    render(<LandingPageNavBar />);
    expect(getMenuButton()).toBeInTheDocument();
    expect(getDrawer()).toBeNull();
  });

  it("opens the drawer when the toggle button is clicked", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(getDrawer()).toBeInTheDocument();
    expect(getMenuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the drawer when the toggle button is clicked again", () => {
    render(<LandingPageNavBar />);
    openMenu();
    fireEvent.click(getMenuButton());
    expect(getDrawer()).toBeNull();
    expect(getMenuButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the drawer when Escape is pressed", () => {
    render(<LandingPageNavBar />);
    openMenu();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(getDrawer()).toBeNull();
  });

  it("drawer has aria-modal=true while open", () => {
    render(<LandingPageNavBar />);
    openMenu();
    const drawer = getDrawer();
    expect(drawer).toHaveAttribute("aria-modal", "true");
  });

  it("drawer has role=dialog while open", () => {
    render(<LandingPageNavBar />);
    openMenu();
    const drawer = getDrawer();
    expect(drawer).toHaveAttribute("role", "dialog");
  });

  it("Tab wraps from last focusable element to first inside the drawer", () => {
    render(<LandingPageNavBar />);
    openMenu();

    const drawer = getDrawer()!;
    const focusableEls = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
    render(<LandingPageNavBar />);
    openMenu();

    const drawer = getDrawer()!;
    const focusableEls = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

    act(() => first.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it("focus returns to the trigger button after closing via Escape", () => {
    render(<LandingPageNavBar />);
    const btn = getMenuButton();

    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(btn);
  });

  it("focus returns to the trigger button after closing via button click", () => {
    render(<LandingPageNavBar />);
    const btn = getMenuButton();

    openMenu();
    fireEvent.click(btn);

    expect(document.activeElement).toBe(btn);
  });

  it("closes the drawer when overlay is clicked (outside click)", () => {
    render(<LandingPageNavBar />);
    openMenu();

    // The overlay is the backdrop — click it to close
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);
    expect(getDrawer()).toBeNull();
  });

  it("closes the drawer when pathname changes (route change)", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(getDrawer()).toBeInTheDocument();

    // Simulate route change
    mockUsePathname.mockReturnValue("/features");
    act(() => {
      // Re-render triggers the usePathname effect
      fireEvent(window, new Event("popstate"));
    });

    // The pathname change effect fires on re-render
    // Since we need to trigger the effect, re-render the component
    const { rerender } = render(<LandingPageNavBar />);
    rerender(<LandingPageNavBar />);
    // After route change, drawer should be closed
    // Note: The useEffect depends on pathname from usePathname(),
    // which changes on re-render
    expect(getDrawer()).toBeNull();
  });

  it("body scroll is locked when drawer is open", () => {
    render(<LandingPageNavBar />);
    openMenu();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).toBe("");
  });
});
