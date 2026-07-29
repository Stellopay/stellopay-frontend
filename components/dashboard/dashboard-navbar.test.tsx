/**
 * Tests for the focus-trap in the mobile drawer of
 * components/dashboard/dashboard-navbar.tsx.
 *
 * Covers:
 * - Drawer opens / closes via the hamburger toggle button.
 * - While the drawer is open, Tab / Shift+Tab cycles only within it.
 * - Escape closes the drawer and returns focus to the trigger button.
 * - Focus returns to the trigger button when the drawer closes.
 * - Drawer has correct ARIA attributes (aria-modal, role="dialog").
 * - Body scroll is locked when drawer is open.
 */
import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardNavbar from "./dashboard-navbar";

// ── Mock external dependencies ────────────────────────────────────────────────

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

vi.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("@/context/wallet-context", () => ({
  useWallet: () => ({
    address: null,
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  formatAddress: (addr: string | null) => (addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : ""),
}));

vi.mock("@/components/common/network-switcher", () => ({
  default: () => <div data-testid="network-switcher" />,
}));

vi.mock("@/public/svg/svg", () => ({
  StellOpayLogo: () => <svg data-testid="stellopay-logo" />,
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

describe("DashboardNavbar mobile drawer focus trap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hamburger toggle button and the drawer is initially closed", () => {
    render(<DashboardNavbar />);
    expect(getMenuButton()).toBeInTheDocument();
    expect(getDrawer()).toBeNull();
  });

  it("opens the drawer when the hamburger toggle is clicked", () => {
    render(<DashboardNavbar />);
    openMenu();
    expect(getDrawer()).toBeInTheDocument();
    expect(getMenuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the drawer when the hamburger toggle is clicked again", () => {
    render(<DashboardNavbar />);
    openMenu();
    fireEvent.click(getMenuButton()); // close
    expect(getDrawer()).toBeNull();
    expect(getMenuButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the drawer when the backdrop overlay is clicked", () => {
    render(<DashboardNavbar />);
    openMenu();
    expect(getDrawer()).toBeInTheDocument();

    // Click the backdrop overlay (div with aria-hidden, not SVG icons)
    const overlay = document.querySelector('div[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(getDrawer()).toBeNull();
  });

  it("closes the drawer when Escape is pressed", () => {
    render(<DashboardNavbar />);
    openMenu();
    expect(getDrawer()).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(getDrawer()).toBeNull();
  });

  it("drawer has aria-modal=true while open", () => {
    render(<DashboardNavbar />);
    openMenu();
    const drawer = getDrawer();
    expect(drawer).toHaveAttribute("aria-modal", "true");
  });

  it("drawer has role='dialog' while open", () => {
    render(<DashboardNavbar />);
    openMenu();
    const drawer = getDrawer();
    expect(drawer).toHaveAttribute("role", "dialog");
  });

  it("Tab wraps from last focusable element to first inside the drawer", () => {
    render(<DashboardNavbar />);
    openMenu();

    const drawer = getDrawer()!;
    const focusableEls = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
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
    render(<DashboardNavbar />);
    openMenu();

    const drawer = getDrawer()!;
    const focusableEls = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    );

    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

    act(() => first.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it("focus returns to the trigger button after closing via Escape", () => {
    render(<DashboardNavbar />);
    const btn = getMenuButton();

    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(btn);
  });

  it("focus returns to the trigger button after closing via button click", () => {
    render(<DashboardNavbar />);
    const btn = getMenuButton();

    openMenu();
    fireEvent.click(btn); // close

    expect(document.activeElement).toBe(btn);
  });

  it("focus returns to the trigger button after closing via overlay click", () => {
    render(<DashboardNavbar />);
    const btn = getMenuButton();

    openMenu();
    const overlay = document.querySelector('div[aria-hidden="true"]');
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(document.activeElement).toBe(btn);
  });

  it("body scroll is locked when drawer is open", () => {
    render(<DashboardNavbar />);
    expect(document.body.style.overflow).toBe("");

    openMenu();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(getMenuButton()); // close
    expect(document.body.style.overflow).toBe("");
  });

  it("body scroll lock is cleaned up on unmount while drawer is open", () => {
    const { unmount } = render(<DashboardNavbar />);
    openMenu();
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("hamburger button becomes an X icon when drawer is open", () => {
    render(<DashboardNavbar />);
    openMenu();

    // The aria-label should indicate "Close navigation menu" when open
    expect(getMenuButton()).toHaveAttribute("aria-label", "Close navigation menu");
  });

  it("hamburger button has aria-controls pointing to the drawer", () => {
    render(<DashboardNavbar />);
    expect(getMenuButton()).toHaveAttribute("aria-controls", "dashboard-mobile-drawer");
  });
});

// ---------------------------------------------------------------------------
// Unread notification badge
// ---------------------------------------------------------------------------

describe("DashboardNavbar – unread notification badge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function getDesktopNotificationBtn() {
    return screen.getByRole("button", { name: /notifications/i });
  }

  it("does not render a badge when unreadCount is 0", () => {
    render(<DashboardNavbar unreadCount={0} />);
    const btn = getDesktopNotificationBtn();
    expect(btn.querySelector(".bg-red-500")).toBeNull();
  });

  it("renders a badge with the unread count when unreadCount > 0", () => {
    render(<DashboardNavbar unreadCount={5} />);
    const btn = getDesktopNotificationBtn();
    expect(btn.querySelector(".bg-red-500")).toHaveTextContent("5");
  });

  it("caps the badge at 9+ when unreadCount exceeds 9", () => {
    render(<DashboardNavbar unreadCount={15} />);
    const btn = getDesktopNotificationBtn();
    expect(btn.querySelector(".bg-red-500")).toHaveTextContent("9+");
  });

  it("includes unread count in aria-label on desktop", () => {
    render(<DashboardNavbar unreadCount={3} />);
    expect(getDesktopNotificationBtn()).toHaveAttribute(
      "aria-label",
      "Notifications, 3 unread",
    );
  });

  it("uses default aria-label when unreadCount is 0", () => {
    render(<DashboardNavbar unreadCount={0} />);
    expect(getDesktopNotificationBtn()).toHaveAttribute(
      "aria-label",
      "Notifications",
    );
  });

  it("renders mobile notification button with badge when open", () => {
    render(<DashboardNavbar unreadCount={7} />);

    const menuBtn = screen.getByRole("button", { name: /open navigation menu/i });
    fireEvent.click(menuBtn);

    const drawer = screen.getByRole("dialog", { name: /mobile navigation menu/i });
    const mobileNotifBtns = within(drawer).getAllByRole("button", { name: "Notifications, 7 unread" });
    expect(mobileNotifBtns.length).toBeGreaterThanOrEqual(1);
    expect(mobileNotifBtns[0].querySelector(".bg-red-500")).toHaveTextContent("7");
  });

  it("defaults to no badge when unreadCount is not provided", () => {
    render(<DashboardNavbar />);
    const btn = getDesktopNotificationBtn();
    expect(btn.querySelector(".bg-red-500")).toBeNull();
  });
});
