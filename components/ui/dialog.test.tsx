/**
 * @fileoverview Tests for components/ui/dialog.tsx
 *
 * Key scenarios:
 * - Focus enters the dialog content on open
 * - Tab / Shift+Tab cycling is trapped within dialog content while open
 * - Focus returns to the trigger element when the dialog closes
 *
 * Radix UI Dialog provides built-in focus trapping and restoration when
 * modal=true (the default).  These tests verify that the wrapper components
 * in this file do not break or suppress that behaviour.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal dialog used throughout the suite. */
function BasicDialog({
  onOpenChange,
  defaultOpen = false,
}: {
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}) {
  return (
    <Dialog defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogTrigger data-testid="trigger">Open Dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogDescription>Are you sure?</DialogDescription>
        <button data-testid="cancel">Cancel</button>
        <button data-testid="confirm">Confirm</button>
      </DialogContent>
    </Dialog>
  );
}

/** Opens the dialog by clicking the trigger and waits for content. */
async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("trigger"));
  await waitFor(() =>
    expect(screen.getByTestId("confirm")).toBeInTheDocument(),
  );
}

/**
 * Returns all focusable elements inside the dialog content area
 * (excluding Radix focus guards and aria-hidden elements).
 */
function getDialogFocusable(): HTMLElement[] {
  const dialog = screen.getByRole("dialog");
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("Dialog — rendering", () => {
  it("renders the trigger button", () => {
    render(<BasicDialog />);
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
  });

  it("does not show dialog content before the trigger is clicked", () => {
    render(<BasicDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows dialog content after the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);

    await openDialog(user);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirmation")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("has dialog-content data-slot attribute", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await openDialog(user);

    expect(
      document.querySelector("[data-slot='dialog-content']"),
    ).toBeInTheDocument();
  });

  it("trigger has data-slot='dialog-trigger'", () => {
    render(<BasicDialog />);
    expect(screen.getByTestId("trigger")).toHaveAttribute(
      "data-slot",
      "dialog-trigger",
    );
  });
});

// ─── Focus behaviour — core acceptance criterion ──────────────────────────────

describe("Dialog — focus behaviour", () => {
  it("moves focus into the dialog content when opened", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);

    await openDialog(user);

    // Radix Dialog focuses the first focusable element inside the content.
    // In DOM order within DialogContent, the close button is rendered
    // after children, so "Cancel" is the first focusable element.
    await waitFor(() => {
      const focusable = getDialogFocusable();
      expect(focusable.some((el) => el === document.activeElement)).toBe(true);
    });
  });

  it("moves focus into the dialog when opened via controlled open prop", async () => {
    render(
      <Dialog open>
        <DialogTrigger data-testid="trigger">Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <button data-testid="btn">Action</button>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("btn")).toBeInTheDocument(),
    );

    await waitFor(() => {
      const focusable = getDialogFocusable();
      expect(focusable.some((el) => el === document.activeElement)).toBe(true);
    });
  });

  it("traps Tab cycling within dialog content", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button data-testid="outside-before">Outside Before</button>
        <BasicDialog />
        <button data-testid="outside-after">Outside After</button>
      </div>,
    );

    await openDialog(user);

    // Tab through all focusable elements multiple times and verify focus
    // stays within the dialog.
    const focusableInside = getDialogFocusable();
    expect(focusableInside.length).toBeGreaterThan(0);

    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < focusableInside.length; i++) {
        expect(document.activeElement).not.toBe(
          screen.getByTestId("outside-before"),
        );
        expect(document.activeElement).not.toBe(
          screen.getByTestId("outside-after"),
        );

        await user.tab();
      }
    }

    expect(screen.getByTestId("outside-before")).not.toHaveFocus();
    expect(screen.getByTestId("outside-after")).not.toHaveFocus();
  });

  it("traps Shift+Tab cycling within dialog content", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button data-testid="outside-before">Outside Before</button>
        <BasicDialog />
        <button data-testid="outside-after">Outside After</button>
      </div>,
    );

    await openDialog(user);

    const focusableInside = getDialogFocusable();
    expect(focusableInside.length).toBeGreaterThan(0);

    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < focusableInside.length; i++) {
        expect(document.activeElement).not.toBe(
          screen.getByTestId("outside-before"),
        );
        expect(document.activeElement).not.toBe(
          screen.getByTestId("outside-after"),
        );

        await user.tab({ shift: true });
      }
    }

    expect(screen.getByTestId("outside-before")).not.toHaveFocus();
    expect(screen.getByTestId("outside-after")).not.toHaveFocus();
  });

  it("returns focus to the trigger on close via Escape", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);

    await openDialog(user);
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.getByTestId("trigger")).toHaveFocus(),
    );
  });

  it("returns focus to the trigger on close via close button", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);

    await openDialog(user);
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() =>
      expect(screen.getByTestId("trigger")).toHaveFocus(),
    );
  });

  it("returns focus to the trigger on close via DialogClose", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogClose data-testid="cancel">Cancel</DialogClose>
          <button data-testid="confirm">Confirm</button>
        </DialogContent>
      </Dialog>,
    );

    await openDialog(user);
    await user.click(screen.getByTestId("cancel"));

    await waitFor(() =>
      expect(screen.getByTestId("trigger")).toHaveFocus(),
    );
  });

  it("dialog can be re-opened after being closed with focus restoration", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);

    await openDialog(user);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.getByTestId("trigger")).toHaveFocus(),
    );

    // Re-open — focus should enter the dialog again.
    await openDialog(user);
    await waitFor(() => {
      const focusable = getDialogFocusable();
      expect(focusable.some((el) => el === document.activeElement)).toBe(true);
    });
  });
});

// ─── Close button ─────────────────────────────────────────────────────────────

describe("Dialog — close button", () => {
  it("renders a close button by default", async () => {
    const user = userEvent.setup();
    render(<BasicDialog />);
    await openDialog(user);

    expect(
      screen.getByRole("button", { name: "Close" }),
    ).toBeInTheDocument();
  });

  it("hides the close button when showCloseButton=false", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );

    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
  });
});

// ─── Controlled open state ────────────────────────────────────────────────────

describe("Dialog — controlled open state", () => {
  it("opens when open=true is set programmatically", async () => {
    render(
      <Dialog open>
        <DialogTrigger data-testid="trigger">Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <button data-testid="action">Action</button>
        </DialogContent>
      </Dialog>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("action")).toBeInTheDocument(),
    );
  });

  it("calls onOpenChange when dialog is closed", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<BasicDialog onOpenChange={onOpenChange} />);

    await openDialog(user);
    await user.keyboard("{Escape}");

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
