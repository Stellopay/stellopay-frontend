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
 *
 * Also covers the notification bell, which mounts the shared
 * components/common/notification-panel.tsx.
 */
import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationItem } from "@/types/notification-item";

const fetchNotifications = vi.hoisted(() =>
  vi.fn<(signal: AbortSignal) => Promise<unknown>>(() => Promise.resolve([])),
);

vi.mock("@/lib/api/notifications", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/notifications")>();
  return { ...actual, fetchNotifications };
});

import DashboardNavbar from "./dashboard-navbar";
import { invalidateNotifications } from "@/components/common/notification-panel";
import { NotificationsSourceUnavailableError } from "@/lib/api/notifications";

beforeEach(() => {
  // The shared notification loader caches at module level; start each test cold.
  invalidateNotifications();
  sessionStorage.clear();
});

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

// ---------------------------------------------------------------------------
// Notification bell → shared NotificationPanel
// ---------------------------------------------------------------------------

describe("DashboardNavbar – notification bell panel", () => {
  const FEED: NotificationItem[] = [
    { id: "1", title: "Payment received", message: "You received $250", read: false, category: "payments" },
    { id: "2", title: "New login", message: "From a new device", read: false, category: "security" },
    { id: "3", title: "Maintenance", message: "Scheduled downtime", read: true, category: "system" },
  ];

  beforeEach(() => {
    fetchNotifications.mockReset();
    fetchNotifications.mockResolvedValue(FEED);
  });

  async function renderNavbar(props: React.ComponentProps<typeof DashboardNavbar> = {}) {
    const utils = render(<DashboardNavbar {...props} />);
    await act(async () => {});
    return utils;
  }

  const getBell = () => screen.getByRole("button", { name: /^notifications/i });
  const queryPanel = () => screen.queryByRole("dialog", { name: "Notifications panel" });

  it("renders the bell as a collapsed popup trigger", async () => {
    await renderNavbar();
    const bell = getBell();

    expect(bell).toHaveAttribute("aria-haspopup", "dialog");
    expect(bell).toHaveAttribute("aria-expanded", "false");
    expect(queryPanel()).toBeNull();
  });

  it("derives the unread badge from the shared feed when no count is passed", async () => {
    await renderNavbar();
    expect(getBell()).toHaveAttribute("aria-label", "Notifications, 2 unread");
  });

  it("still honours an explicit unreadCount", async () => {
    await renderNavbar({ unreadCount: 12 });
    expect(getBell()).toHaveAttribute("aria-label", "Notifications, 9+ unread");
  });

  it("opens the shared panel with the feed when the bell is clicked", async () => {
    await renderNavbar();
    const bell = getBell();

    fireEvent.click(bell);

    const panel = queryPanel();
    expect(panel).toBeInTheDocument();
    expect(bell).toHaveAttribute("aria-expanded", "true");
    expect(bell).toHaveAttribute("aria-controls", panel!.id);
    expect(within(panel!).getByRole("listbox", { name: "Notifications list" })).toBeInTheDocument();
    expect(within(panel!).getByText("Payment received")).toBeInTheDocument();
    expect(within(panel!).getByRole("tablist", { name: /filter notifications/i })).toBeInTheDocument();
    expect(within(panel!).getByRole("link", { name: /view all/i })).toHaveAttribute("href", "/notifications");
  });

  it("closes the panel when the bell is clicked again", async () => {
    await renderNavbar();
    const bell = getBell();

    fireEvent.click(bell);
    fireEvent.click(bell);

    expect(queryPanel()).toBeNull();
    expect(bell).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and returns focus to the bell", async () => {
    await renderNavbar();
    const bell = getBell();
    fireEvent.click(bell);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(queryPanel()).toBeNull();
    expect(document.activeElement).toBe(bell);
  });

  it("closes on Escape pressed inside the notification list", async () => {
    await renderNavbar();
    const bell = getBell();
    fireEvent.click(bell);

    const option = within(queryPanel()!).getAllByRole("option")[0];
    act(() => option.focus());
    fireEvent.keyDown(option, { key: "Escape" });

    expect(queryPanel()).toBeNull();
    expect(document.activeElement).toBe(bell);
  });

  it("closes when the user clicks outside the panel", async () => {
    await renderNavbar();
    fireEvent.click(getBell());

    fireEvent.mouseDown(screen.getByRole("link", { name: /stellopay home/i }));

    expect(queryPanel()).toBeNull();
  });

  it("stays open for clicks inside the panel", async () => {
    await renderNavbar();
    fireEvent.click(getBell());
    const panel = queryPanel()!;

    const securityTab = within(panel).getByRole("tab", { name: /security/i });
    fireEvent.mouseDown(securityTab);
    fireEvent.click(securityTab);

    expect(queryPanel()).toBeInTheDocument();
    expect(within(panel).getByText("New login")).toBeInTheDocument();
    expect(within(panel).queryByText("Payment received")).not.toBeInTheDocument();
  });

  it("supports arrow-key navigation through the notifications", async () => {
    await renderNavbar();
    fireEvent.click(getBell());
    const panel = queryPanel()!;
    const listbox = within(panel).getByRole("listbox");

    fireEvent.keyDown(listbox, { key: "ArrowDown" });

    const options = within(panel).getAllByRole("option");
    expect(document.activeElement).toBe(options[1]);
    expect(options[1]).toHaveAttribute("aria-selected", "true");
  });

  it("forwards notification activation to the host", async () => {
    const onNotificationClick = vi.fn();
    await renderNavbar({ onNotificationClick });
    fireEvent.click(getBell());

    fireEvent.click(within(queryPanel()!).getByText("New login"));

    expect(onNotificationClick).toHaveBeenCalledWith(FEED[1]);
  });

  it("shares one request between the bell and other consumers", async () => {
    await renderNavbar();
    fireEvent.click(getBell());
    expect(fetchNotifications).toHaveBeenCalledTimes(1);
  });

  it("explains when no notification source is connected, without a retry", async () => {
    fetchNotifications.mockRejectedValue(new NotificationsSourceUnavailableError());
    await renderNavbar();
    fireEvent.click(getBell());

    const alert = within(queryPanel()!).getByRole("alert");
    expect(alert).toHaveTextContent(/isn't connected yet/i);
    expect(within(alert).queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("shows a retryable error when loading fails", async () => {
    fetchNotifications.mockRejectedValueOnce(new Error("offline"));
    await renderNavbar();
    fireEvent.click(getBell());

    const alert = within(queryPanel()!).getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load notifications.");

    fireEvent.click(within(alert).getByRole("button", { name: /try again/i }));
    await act(async () => {});

    expect(fetchNotifications).toHaveBeenCalledTimes(2);
    expect(within(queryPanel()!).getByText("Payment received")).toBeInTheDocument();
  });

  it("expands the shared panel inline from the mobile drawer", async () => {
    await renderNavbar();
    fireEvent.click(screen.getByRole("button", { name: /open navigation menu/i }));
    const drawer = screen.getByRole("dialog", { name: /mobile navigation menu/i });
    const mobileBell = within(drawer).getByRole("button", { name: /^notifications/i });

    expect(mobileBell).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(mobileBell);

    expect(mobileBell).toHaveAttribute("aria-expanded", "true");
    expect(within(drawer).getByText("Payment received")).toBeInTheDocument();

    fireEvent.click(mobileBell);
    expect(within(drawer).queryByText("Payment received")).toBeNull();
  });

  it("keeps theme toggle and wallet controls working while the panel is open", async () => {
    await renderNavbar();
    fireEvent.click(getBell());

    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-navbar-connect")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });
});
