/**
 * Unit tests for ShortcutHelpModal
 *
 * Covers:
 *  Rendering
 *  ─────────
 *  - Modal is absent from the DOM when open=false.
 *  - Modal is present when open=true.
 *  - Dialog title and description are rendered.
 *  - All shortcut group headings are rendered.
 *  - Each shortcut description is rendered.
 *  - Each shortcut key badge is rendered with correct text.
 *  - Multi-key sequences include a "then" separator.
 *  - Empty-groups state renders the "No shortcuts registered" notice.
 *  - Custom groups prop overrides the default SHORTCUT_GROUPS.
 *
 *  Accessibility
 *  ─────────────
 *  - The scrollable region has role="region" and an accessible name.
 *  - The scrollable region has tabIndex=0 (keyboard-scrollable).
 *  - Key sequence spans have role="img" and aria-label.
 *  - The dialog is modal (aria-modal="true").
 *  - Group sections are labelled by their heading (aria-labelledby).
 *
 *  Behaviour
 *  ─────────
 *  - onClose is called when the Radix close button is activated.
 *  - onClose is called when Escape is pressed.
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ShortcutHelpModal } from "./shortcut-help-modal";
import type { ShortcutGroup } from "@/lib/shortcuts";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Minimal shortcut group used in most tests (avoids depending on the live
 *  SHORTCUT_GROUPS registry so tests remain stable when entries change). */
const SINGLE_GROUP: ShortcutGroup[] = [
  {
    id: "global",
    label: "Global",
    shortcuts: [
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close modal" },
    ],
  },
];

const MULTI_KEY_GROUP: ShortcutGroup[] = [
  {
    id: "nav",
    label: "Navigation",
    shortcuts: [
      { keys: ["g", "d"], description: "Go to Dashboard" },
    ],
  },
];

const MULTI_GROUP: ShortcutGroup[] = [
  {
    id: "global",
    label: "Global",
    shortcuts: [{ keys: ["?"], description: "Show shortcuts" }],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    shortcuts: [{ keys: ["n"], description: "New payment" }],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderModal(props: Partial<React.ComponentProps<typeof ShortcutHelpModal>> = {}) {
  const onClose = vi.fn();
  const result = render(
    <ShortcutHelpModal
      open={false}
      onClose={onClose}
      groups={SINGLE_GROUP}
      {...props}
    />,
  );
  return { ...result, onClose };
}

afterEach(cleanup);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ShortcutHelpModal — rendering", () => {
  it("is absent from the DOM when open=false", () => {
    renderModal({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is present in the DOM when open=true", () => {
    renderModal({ open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the dialog title 'Keyboard Shortcuts'", () => {
    renderModal({ open: true });
    expect(
      screen.getByRole("heading", { name: /keyboard shortcuts/i }),
    ).toBeInTheDocument();
  });

  it("renders the dialog description mentioning '?'", () => {
    renderModal({ open: true });
    // DialogDescription text is in the DOM even if not a heading/role=text
    expect(screen.getByText(/at any time to open this reference/i)).toBeInTheDocument();
  });

  it("renders the group heading for every group", () => {
    renderModal({ open: true, groups: MULTI_GROUP });
    expect(
      screen.getByRole("heading", { level: 3, name: /global/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /dashboard/i }),
    ).toBeInTheDocument();
  });

  it("renders each shortcut description", () => {
    renderModal({ open: true });
    expect(screen.getByText("Show keyboard shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Close modal")).toBeInTheDocument();
  });

  it("renders each shortcut key as a <kbd> element", () => {
    renderModal({ open: true });
    // SINGLE_GROUP has keys: ["?"] and ["Esc"]
    // <kbd> elements are rendered as key-cap badges; verify by text content
    // (Testing Library does not map <kbd> to a specific ARIA role)
    const kbds = document.querySelectorAll("kbd");
    expect(kbds.length).toBeGreaterThan(0);
    // Check the key text values directly
    const kbdTexts = Array.from(kbds).map((k) => k.textContent);
    expect(kbdTexts).toContain("?");
    expect(kbdTexts).toContain("Esc");
  });

  it("renders the 'then' separator between multi-key combos", () => {
    renderModal({ open: true, groups: MULTI_KEY_GROUP });
    expect(screen.getByText("g")).toBeInTheDocument();
    expect(screen.getByText("d")).toBeInTheDocument();
    // "then" separator text
    expect(screen.getByText("then")).toBeInTheDocument();
  });

  it("renders 'No shortcuts registered' when groups is empty", () => {
    renderModal({ open: true, groups: [] });
    expect(
      screen.getByText(/no shortcuts registered/i),
    ).toBeInTheDocument();
  });

  it("empty-state notice has role=status", () => {
    renderModal({ open: true, groups: [] });
    expect(
      screen.getByRole("status"),
    ).toBeInTheDocument();
  });

  it("custom groups prop overrides the default SHORTCUT_GROUPS", () => {
    renderModal({ open: true, groups: MULTI_KEY_GROUP });
    // Navigation group heading should be present
    expect(
      screen.getByRole("heading", { level: 3, name: /navigation/i }),
    ).toBeInTheDocument();
    // SINGLE_GROUP's "Global" heading should NOT be present
    expect(
      screen.queryByRole("heading", { level: 3, name: /global/i }),
    ).not.toBeInTheDocument();
  });
});

// ─── Accessibility ─────────────────────────────────────────────────────────────

describe("ShortcutHelpModal — accessibility", () => {
  it("the dialog has role='dialog'", () => {
    renderModal({ open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("the dialog is labelled by the title", () => {
    renderModal({ open: true });
    const dialog = screen.getByRole("dialog");
    // Radix wires aria-labelledby to the DialogTitle automatically
    expect(dialog).toHaveAttribute("aria-labelledby");
  });

  it("the dialog has aria-modal='true'", () => {
    renderModal({ open: true });
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("the scrollable region has role='region'", () => {
    renderModal({ open: true });
    expect(
      screen.getByRole("region", { name: /keyboard shortcut list/i }),
    ).toBeInTheDocument();
  });

  it("the scrollable region has tabIndex=0 (keyboard-scrollable)", () => {
    renderModal({ open: true });
    const region = screen.getByRole("region", {
      name: /keyboard shortcut list/i,
    });
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("key sequence containers have role='img' and aria-label", () => {
    renderModal({ open: true, groups: MULTI_KEY_GROUP });
    // Multi-key combo: ["g", "d"] → aria-label="g then d"
    const imgs = screen.getAllByRole("img", { name: /g then d/i });
    expect(imgs.length).toBeGreaterThan(0);
  });

  it("single-key sequences also have role='img' with the key as aria-label", () => {
    renderModal({ open: true, groups: SINGLE_GROUP });
    // "?" key
    const questionImg = screen.getByRole("img", { name: /^\?$/ });
    expect(questionImg).toBeInTheDocument();
  });

  it("each group section is labelled by its heading via aria-labelledby", () => {
    renderModal({ open: true });
    const section = screen
      .getAllByRole("region")
      .find((el) => el.tagName.toLowerCase() === "section");
    if (!section) {
      // Sections with aria-labelledby are not surfaced by jsdom as role="region"
      // unless they also have aria-label. Check the attribute directly.
      const sections = document
        .querySelectorAll("section[aria-labelledby]");
      expect(sections.length).toBeGreaterThan(0);
    } else {
      expect(section).toHaveAttribute("aria-labelledby");
    }
  });

  it("group heading ids match section aria-labelledby values", () => {
    renderModal({ open: true, groups: MULTI_GROUP });
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[aria-labelledby]"),
    );
    sections.forEach((section) => {
      const labelId = section.getAttribute("aria-labelledby")!;
      const heading = document.getElementById(labelId);
      expect(heading).toBeInTheDocument();
    });
  });
});

// ─── Behaviour ────────────────────────────────────────────────────────────────

describe("ShortcutHelpModal — behaviour", () => {
  it("calls onClose when the Radix close button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ open: true });

    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ open: true });

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when the modal is closed and Escape is pressed", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ open: false });

    await user.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("re-renders cleanly when groups prop changes", () => {
    const { rerender, onClose } = renderModal({
      open: true,
      groups: SINGLE_GROUP,
    });
    expect(
      screen.getByRole("heading", { level: 3, name: /global/i }),
    ).toBeInTheDocument();

    rerender(
      <ShortcutHelpModal
        open={true}
        onClose={onClose}
        groups={MULTI_KEY_GROUP}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: /navigation/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: /global/i }),
    ).not.toBeInTheDocument();
  });

  it("correctly transitions from open to closed (modal disappears)", () => {
    const { rerender, onClose } = renderModal({ open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(
      <ShortcutHelpModal open={false} onClose={onClose} groups={SINGLE_GROUP} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
