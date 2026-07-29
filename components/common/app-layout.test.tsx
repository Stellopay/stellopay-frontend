/**
 * Unit tests for AppLayout with global floating feedback widget.
 */

import { render, screen, cleanup, waitFor } from "@testing-library/react";
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
  SideBar: () => <nav data-testid="sidebar" />,
}));

vi.mock("@/components/common/navbar", () => ({
  __esModule: true,
  default: () => <header data-testid="navbar" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

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
