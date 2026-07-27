/**
 * @fileoverview Tests for components/ui/dropdown-menu.tsx
 *
 * Key scenarios:
 * - Escape key closes an open menu and returns focus to the trigger
 * - Clicking outside closes the menu
 * - Menu items are accessible and clickable
 * - onEscapeKeyDown / onInteractOutside callbacks are forwarded to consumers
 * - Sub-menus and compound components render correctly
 *
 * Radix UI DropdownMenu manages Escape handling natively when modal=true
 * (the default).  These tests verify that the wrapper components in this
 * file do not break or suppress that behaviour.
 */

import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./dropdown-menu";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal dropdown used throughout the suite. */
function BasicDropdown({
  onItemClick,
  onEscapeKeyDown,
  onInteractOutside,
}: {
  onItemClick?: () => void;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
  onInteractOutside?: (e: Event) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-testid="trigger">Open Menu</DropdownMenuTrigger>
      <DropdownMenuContent
        onEscapeKeyDown={onEscapeKeyDown}
        onInteractOutside={onInteractOutside}
      >
        <DropdownMenuItem data-testid="item-1" onClick={onItemClick}>
          Item One
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="item-2">Item Two</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Opens the dropdown by clicking the trigger and waits for content. */
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("trigger"));
  await waitFor(() =>
    expect(screen.queryByTestId("item-1")).toBeInTheDocument(),
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("DropdownMenu — rendering", () => {
  it("renders the trigger button", () => {
    render(<BasicDropdown />);
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
  });

  it("does not show menu content before the trigger is clicked", () => {
    render(<BasicDropdown />);
    expect(screen.queryByTestId("item-1")).not.toBeInTheDocument();
  });

  it("shows menu items after the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);

    await openMenu(user);

    expect(screen.getByTestId("item-1")).toBeInTheDocument();
    expect(screen.getByTestId("item-2")).toBeInTheDocument();
  });

  it("trigger has data-slot='dropdown-menu-trigger'", () => {
    render(<BasicDropdown />);
    expect(screen.getByTestId("trigger")).toHaveAttribute(
      "data-slot",
      "dropdown-menu-trigger",
    );
  });

  it("content container has data-slot='dropdown-menu-content'", async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);
    await openMenu(user);

    expect(
      document.querySelector("[data-slot='dropdown-menu-content']"),
    ).toBeInTheDocument();
  });
});

// ─── Escape key — core acceptance criterion ───────────────────────────────────

describe("DropdownMenu — Escape key behaviour", () => {
  beforeEach(() => {
    // Radix renders menu content into document.body via a Portal.
    // userEvent.setup() uses the correct event dispatch path.
  });

  it("closes the menu when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);

    await openMenu(user);
    expect(screen.getByTestId("item-1")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByTestId("item-1")).not.toBeInTheDocument(),
    );
  });

  it("returns focus to the trigger after closing with Escape", async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);

    await openMenu(user);
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.getByTestId("trigger")).toHaveFocus(),
    );
  });

  it("does not close when Escape is pressed while the menu is already closed", async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);

    // Menu is closed — Escape should be a no-op.
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("item-1")).not.toBeInTheDocument();
  });

  it("calls onEscapeKeyDown callback when Escape is pressed", async () => {
    const onEscapeKeyDown = vi.fn();
    const user = userEvent.setup();
    render(<BasicDropdown onEscapeKeyDown={onEscapeKeyDown} />);

    await openMenu(user);
    await user.keyboard("{Escape}");

    await waitFor(() => expect(onEscapeKeyDown).toHaveBeenCalledOnce());
  });

  it("menu can be re-opened after being closed with Escape", async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);

    await openMenu(user);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByTestId("item-1")).not.toBeInTheDocument(),
    );

    // Re-open.
    await openMenu(user);
    expect(screen.getByTestId("item-1")).toBeInTheDocument();
  });
});

// ─── Click-outside behaviour ──────────────────────────────────────────────────

describe("DropdownMenu — click-outside behaviour", () => {
  it("closes the menu when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <BasicDropdown />
        <button data-testid="outside">Outside</button>
      </div>,
    );

    await openMenu(user);
    expect(screen.getByTestId("item-1")).toBeInTheDocument();

    await user.click(screen.getByTestId("outside"));

    await waitFor(() =>
      expect(screen.queryByTestId("item-1")).not.toBeInTheDocument(),
    );
  });

  it("calls onInteractOutside when clicking outside", async () => {
    const onInteractOutside = vi.fn();
    const user = userEvent.setup();
    render(
      <div>
        <BasicDropdown onInteractOutside={onInteractOutside} />
        <button data-testid="outside">Outside</button>
      </div>,
    );

    await openMenu(user);
    await user.click(screen.getByTestId("outside"));

    await waitFor(() => expect(onInteractOutside).toHaveBeenCalledOnce());
  });
});

// ─── Menu item interaction ────────────────────────────────────────────────────

describe("DropdownMenu — menu item interaction", () => {
  it("calls the item onClick handler when clicked", async () => {
    const onItemClick = vi.fn();
    const user = userEvent.setup();
    render(<BasicDropdown onItemClick={onItemClick} />);

    await openMenu(user);
    await user.click(screen.getByTestId("item-1"));

    expect(onItemClick).toHaveBeenCalledOnce();
  });

  it("closes the menu after an item is clicked", async () => {
    const user = userEvent.setup();
    render(<BasicDropdown onItemClick={() => {}} />);

    await openMenu(user);
    await user.click(screen.getByTestId("item-1"));

    await waitFor(() =>
      expect(screen.queryByTestId("item-1")).not.toBeInTheDocument(),
    );
  });

  it("menu items are navigable with arrow keys", async () => {
    const user = userEvent.setup();
    render(<BasicDropdown />);

    await openMenu(user);

    // Arrow down should move focus through items.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByTestId("item-1")).toHaveFocus();
  });
});

// ─── Compound components ──────────────────────────────────────────────────────

describe("DropdownMenu — compound components render correctly", () => {
  it("renders DropdownMenuSeparator", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
          <DropdownMenuSeparator data-testid="separator" />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(
        document.querySelector("[data-slot='dropdown-menu-separator']"),
      ).toBeInTheDocument(),
    );
  });

  it("renders DropdownMenuLabel", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(screen.getByText("Actions")).toBeInTheDocument(),
    );
  });

  it("renders DropdownMenuShortcut", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Copy
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(screen.getByText("⌘C")).toBeInTheDocument(),
    );
  });

  it("renders DropdownMenuCheckboxItem and toggles checked state", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();

    function CheckboxDropdown() {
      const [checked, setChecked] = React.useState(false);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={checked}
              onCheckedChange={(val) => {
                setChecked(!!val);
                onCheckedChange(val);
              }}
            >
              Checkbox Item
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    render(<CheckboxDropdown />);
    await user.click(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(screen.getByText("Checkbox Item")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("Checkbox Item"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("renders DropdownMenuRadioGroup with RadioItems", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(screen.getByText("Option A")).toBeInTheDocument(),
    );

    await user.click(screen.getByText("Option B"));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("renders DropdownMenuGroup with data-slot attribute", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup data-testid="group">
            <DropdownMenuItem>Grouped Item</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(
        document.querySelector("[data-slot='dropdown-menu-group']"),
      ).toBeInTheDocument(),
    );
  });

  it("renders DropdownMenuSub with sub-trigger and sub-content", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger data-testid="sub-trigger">
              More Options
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem data-testid="sub-item">
                Sub Item
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() =>
      expect(screen.getByTestId("sub-trigger")).toBeInTheDocument(),
    );
  });

  it("renders destructive DropdownMenuItem variant", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive" data-testid="destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() => {
      const item = screen.getByTestId("destructive");
      expect(item).toHaveAttribute("data-variant", "destructive");
    });
  });

  it("renders inset DropdownMenuItem", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset data-testid="inset-item">
            Inset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    await waitFor(() => {
      const item = screen.getByTestId("inset-item");
      expect(item).toHaveAttribute("data-inset", "true");
    });
  });
});

// ─── Controlled open state ────────────────────────────────────────────────────

describe("DropdownMenu — controlled open state", () => {
  it("opens when open=true is set programmatically", async () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem data-testid="item">Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("item")).toBeInTheDocument(),
    );
  });

  it("calls onOpenChange when the menu requests a state change", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger data-testid="trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByTestId("trigger"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
