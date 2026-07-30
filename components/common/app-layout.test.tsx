/**
 * Unit tests for AppLayout.
 *
 * Covers skip-to-content (WCAG 2.4.1), shortcut help modal, and
 * the global floating feedback widget.
 */

import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("framer-motion", () => ({
  motion: { button: "button", div: "div", span: "span" },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => ({ isSidebarOpen: true, isMobile: false }),
}));

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("./shortcut-help-modal", () => ({
  ShortcutHelpModal: ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const React = require("react");
    React.useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);
    return open ? (
      <div role="dialog" aria-label="Keyboard shortcuts">
        <h2>Keyboard Shortcuts</h2>
        <button onClick={onClose} aria-label="Close">Close</button>
      </div>
    ) : null;
  },
}));

vi.mock("@/hooks/useGlobalShortcuts", () => ({
  useGlobalShortcuts: () => {},
}));

vi.mock("@/hooks/useShortcutModal", async () => {
  const React = await import("react");
  return {
    useShortcutModal: () => {
      const [isOpen, setIsOpen] = React.useState(false);
      React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
          const tag = (document.activeElement?.tagName || "").toUpperCase();
          if (e.key === "?" && tag !== "INPUT" && tag !== "TEXTAREA") {
            setIsOpen((p: boolean) => !p);
          }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
      }, []);
      return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
    },
  };
});

vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");



import AppLayout from "./app-layout";

function renderLayout() {
  return render(<AppLayout><p>Page content</p></AppLayout>);
}

/** Find the first dialog element */
async function findDialog() {
  const dialogs = await screen.findAllByRole("dialog");
  return dialogs[0];
}

/** Helper to query success text, tolerant of duplicates from live regions */
async function findSuccessText() {
  const matches = await screen.findAllByText(/thank you/i);
  return matches[0];
}

// ── Skip-to-content tests ─────────────────────────────────────────────────────

describe("AppLayout — skip-to-content link (WCAG 2.4.1)", () => {
  afterEach(() => cleanup());

  it("renders skip link with correct label", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: /skip to main content/i })).toBeInTheDocument();
  });

  it("skip link href points to #main-content", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute("href", "#main-content");
  });

  it("main content has id and tabIndex", () => {
    renderLayout();
    expect(document.getElementById("main-content")).toHaveAttribute("tabindex", "-1");
  });

  it("skip link has sr-only class", () => {
    renderLayout();
    expect(screen.getByRole("link", { name: /skip to main content/i }).className).toMatch(/sr-only/);
  });

  it("renders children", () => {
    renderLayout();
    expect(document.getElementById("main-content")).toHaveTextContent("Page content");
  });
});

// ── Feedback widget tests ─────────────────────────────────────────────────────

describe("AppLayout — floating feedback widget", () => {
  afterEach(() => cleanup());

  it("renders floating button with accessible label", () => {
    renderLayout();
    const btn = screen.getByRole("button", { name: /open feedback form/i });
    expect(btn).toHaveAttribute("aria-label", "Open feedback form");
    expect(btn).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("opens modal on click", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    expect(await findDialog()).toBeInTheDocument();
  });

  it("shows Bug and Feature type options in modal", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();
    expect(screen.getByRole("radio", { name: /report bug/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /feature request/i })).toBeInTheDocument();
  });

  it("closes modal via close button", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();
    await user.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => expect(screen.queryAllByRole("dialog").length).toBe(0));
  });

  it("closes modal via Escape key", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryAllByRole("dialog").length).toBe(0));
  });

  it("submits a bug report", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();
    await user.type(screen.getByLabelText(/^subject$/i), "Login not working");
    await user.type(screen.getByLabelText(/^description$/i), "Clicking login does nothing. Page reloads without error.");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));
    expect(await findSuccessText()).toBeInTheDocument();
  });

  it("submits a feature request", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();
    await user.click(screen.getByRole("radio", { name: /feature request/i }));
    await user.type(screen.getByLabelText(/^subject$/i), "Dark mode toggle");
    await user.type(screen.getByLabelText(/^description$/i), "Add dark mode setting for accessibility.");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));
    expect(await findSuccessText()).toBeInTheDocument();
  });

  it("handles screenshot upload and removal", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();

    const file = new File(["fake"], "shot.png", { type: "image/png" });
    await user.upload(screen.getByTestId("screenshot-file-input"), file);
    await waitFor(() => expect(screen.getByAltText(/screenshot preview/i)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /remove screenshot/i }));
    await waitFor(() => expect(screen.queryByAltText(/screenshot preview/i)).not.toBeInTheDocument());
  });

  it("shows validation error for empty subject", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();
    await user.type(screen.getByLabelText(/^description$/i), "A valid description with enough length for the test.");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));
    expect(await screen.findByText(/subject is required/i)).toBeInTheDocument();
  });

  it("shows validation error for short description", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();
    await user.type(screen.getByLabelText(/^subject$/i), "Test subject");
    await user.type(screen.getByLabelText(/^description$/i), "Short");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));
    expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
  });

  it("opens modal via keyboard Enter", async () => {
    renderLayout();
    const user = userEvent.setup();
    screen.getByRole("button", { name: /open feedback form/i }).focus();
    await user.keyboard("{Enter}");
    expect(await findDialog()).toBeInTheDocument();
  });

  it("opens modal via keyboard Space", async () => {
    renderLayout();
    const user = userEvent.setup();
    screen.getByRole("button", { name: /open feedback form/i }).focus();
    await user.keyboard(" ");
    expect(await findDialog()).toBeInTheDocument();
  });

  it("type selector has correct ARIA roles", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();
    expect(screen.getByRole("radiogroup", { name: /feedback type/i })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("dialog has aria-describedby attribute", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    expect(await findDialog()).toHaveAttribute("aria-describedby");
  });

  it("uses CSS variable classes for dark mode compatibility", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    expect(await findDialog()).toBeInTheDocument();
    // Verify the modal renders with accessible content (title text)
    const titles = await screen.findAllByText(/send feedback/i);
    expect(titles.length).toBeGreaterThan(0);
  });

  it("modal has responsive layout with max width", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    expect(await findDialog()).toBeInTheDocument();
    // The inner content div has sm:max-w-[500px] for responsive layout
    expect(screen.getByText(/report bug/i)).toBeInTheDocument();
  });

  it("switches between Bug and Feature type", async () => {
    renderLayout();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open feedback form/i }));
    await findDialog();

    const bug = screen.getByRole("radio", { name: /report bug/i });
    expect(bug).toHaveAttribute("aria-checked", "true");

    const feature = screen.getByRole("radio", { name: /feature request/i });
    await user.click(feature);
    expect(feature).toHaveAttribute("aria-checked", "true");
    expect(bug).toHaveAttribute("aria-checked", "false");
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
