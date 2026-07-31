import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SortControl from "./sort";
import type { SortConfig } from "@/types/transaction";

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children, asChild, ...props }: any) => (
    <button data-testid="dropdown-trigger" {...props}>
      {children}
    </button>
  ),
  DropdownMenuContent: ({
    children,
    role,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    role?: string;
    "aria-label"?: string;
  }) => (
    <div data-testid="dropdown-content" role={role} aria-label={ariaLabel}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    onKeyDown,
    className,
    role,
    "aria-checked": ariaChecked,
    "data-testid": testid,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    className?: string;
    role?: string;
    "aria-checked"?: boolean | "mixed" | undefined;
    "data-testid"?: string;
  }) => (
    <div
      data-testid={testid ?? "dropdown-item"}
      className={className}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role ?? "menuitem"}
      aria-checked={ariaChecked}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  ),
}));

const defaultSortConfigs: SortConfig[] = [
  { field: "date", direction: "desc" },
];

const multiSortConfigs: SortConfig[] = [
  { field: "status", direction: "asc" },
  { field: "amount", direction: "desc" },
];

describe("SortControl", () => {
  it("renders the trigger button with primary sort label", () => {
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const trigger = screen.getByTestId("dropdown-trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Date");
    expect(trigger).toHaveTextContent("\u2193");
  });

  it("renders 'Sort' as default label when no sort configs are set", () => {
    render(
      <SortControl
        sortConfigs={[]}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const trigger = screen.getByTestId("dropdown-trigger");
    expect(trigger).toHaveTextContent("Sort");
  });

  it("renders all sort field options in the dropdown", () => {
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sort-item-date")).toBeInTheDocument();
    expect(screen.getByTestId("sort-item-amount")).toBeInTheDocument();
    expect(screen.getByTestId("sort-item-type")).toBeInTheDocument();
    expect(screen.getByTestId("sort-item-status")).toBeInTheDocument();
  });

  it("shows sort order indicator (#2) for secondary sort item", () => {
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const statusItem = screen.getByTestId("sort-item-status");
    const amountItem = screen.getByTestId("sort-item-amount");
    expect(statusItem).toHaveTextContent("\u2191");
    expect(amountItem).toHaveTextContent("\u2193");
    expect(amountItem).toHaveTextContent("#2");
  });

  it("calls onSort with the field and shiftKey=false on normal click", () => {
    const handleSort = vi.fn();
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={handleSort}
        onClearSecondarySort={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("sort-item-amount"));
    expect(handleSort).toHaveBeenCalledWith("amount", { shiftKey: false });
  });

  it("passes shiftKey=true when shift-clicking", () => {
    const handleSort = vi.fn();
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={handleSort}
        onClearSecondarySort={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("sort-item-type"), {
      shiftKey: true,
    });
    expect(handleSort).toHaveBeenCalledWith("type", { shiftKey: true });
  });

  it("shows the secondary sort chip when secondary config is present", () => {
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    expect(screen.getByText(/then Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/\u2193/)).toBeInTheDocument();
  });

  it("does NOT show secondary sort chip when only primary is set", () => {
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    expect(screen.queryByText(/then/i)).not.toBeInTheDocument();
  });

  it("calls onClearSecondarySort when the chip close button is clicked", () => {
    const handleClear = vi.fn();
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={handleClear}
      />,
    );
    const closeBtn = screen.getByLabelText(/clear secondary sort/i);
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("has accessible aria-label on the trigger button", () => {
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const trigger = screen.getByLabelText(/sort transactions/i);
    expect(trigger).toBeInTheDocument();
  });

  it("has accessible aria-label on the clear secondary sort button", () => {
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/clear secondary sort/i)).toBeInTheDocument();
  });
});

describe("SortControl — aria-sort on columnheaders", () => {
  it("sets aria-sort='descending' on the primary sort columnheader", () => {
    render(
      <SortControl
        sortConfigs={[{ field: "date", direction: "desc" }]}
        onSort={vi.fn()}
      />,
    );
    const dateHeader = screen.getByTestId("sort-columnheader-date");
    const amountHeader = screen.getByTestId("sort-columnheader-amount");
    expect(dateHeader).toHaveAttribute("aria-sort", "descending");
    expect(amountHeader).not.toHaveAttribute("aria-sort");
  });

  it("sets aria-sort='ascending' on the primary sort columnheader when direction=asc", () => {
    render(
      <SortControl
        sortConfigs={[{ field: "amount", direction: "asc" }]}
        onSort={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sort-columnheader-amount")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByTestId("sort-columnheader-date")).not.toHaveAttribute(
      "aria-sort",
    );
  });

  it("sets aria-sort='other' on the secondary sort columnheader", () => {
    render(
      <SortControl
        sortConfigs={[
          { field: "status", direction: "asc" },
          { field: "amount", direction: "desc" },
        ]}
        onSort={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sort-columnheader-status")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByTestId("sort-columnheader-amount")).toHaveAttribute(
      "aria-sort",
      "other",
    );
  });

  it("omits aria-sort on all columnheaders when no sort is active", () => {
    render(<SortControl sortConfigs={[]} onSort={vi.fn()} />);
    for (const field of ["date", "amount", "type", "status"]) {
      expect(
        screen.getByTestId(`sort-columnheader-${field}`),
      ).not.toHaveAttribute("aria-sort");
    }
  });
});

describe("SortControl — aria-live announcements", () => {
  it("announces the new sort order through the aria-live region after onSort triggers a re-render", () => {
    const { rerender } = render(
      <SortControl
        sortConfigs={[{ field: "date", direction: "desc" }]}
        onSort={vi.fn()}
      />,
    );
    const live = screen.getByTestId("sort-announcement");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveAttribute("aria-atomic", "true");
    expect(live).toHaveTextContent("");

    rerender(
      <SortControl
        sortConfigs={[{ field: "amount", direction: "asc" }]}
        onSort={vi.fn()}
      />,
    );
    expect(live).toHaveTextContent(
      "Sorted by Amount ascending.",
      { exact: false },
    );
  });

  it("announces both primary and secondary sort in the live region", () => {
    const { rerender } = render(
      <SortControl
        sortConfigs={[{ field: "date", direction: "desc" }]}
        onSort={vi.fn()}
      />,
    );

    rerender(
      <SortControl
        sortConfigs={[
          { field: "status", direction: "asc" },
          { field: "amount", direction: "desc" },
        ]}
        onSort={vi.fn()}
      />,
    );
    const live = screen.getByTestId("sort-announcement");
    expect(live).toHaveTextContent(/Sorted by Status ascending/i);
    expect(live).toHaveTextContent(/then by Amount descending/i);
  });

  it("does not announce on the initial mount", () => {
    render(
      <SortControl
        sortConfigs={[{ field: "date", direction: "desc" }]}
        onSort={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sort-announcement")).toHaveTextContent("");
  });
});

describe("SortControl — Enter / Space operability", () => {
  it("activates a sort item with the Enter key", () => {
    const handleSort = vi.fn();
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={handleSort}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const item = screen.getByTestId("sort-item-status");
    fireEvent.keyDown(item, { key: "Enter", code: "Enter" });
    expect(handleSort).toHaveBeenCalledWith("status", { shiftKey: false });
  });

  it("activates a sort item with the Space key and preventDefault is called", () => {
    const handleSort = vi.fn();
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={handleSort}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const item = screen.getByTestId("sort-item-amount");
    const preventDefault = vi.fn();
    fireEvent.keyDown(item, {
      key: " ",
      code: "Space",
      preventDefault,
    } as unknown as React.KeyboardEvent);
    expect(preventDefault).toHaveBeenCalled();
    expect(handleSort).toHaveBeenCalledWith("amount", { shiftKey: false });
  });

  it("does NOT call onSort when a non-Enter/Space key (e.g. ArrowDown) is pressed", () => {
    const handleSort = vi.fn();
    render(
      <SortControl
        sortConfigs={defaultSortConfigs}
        onSort={handleSort}
        onClearSecondarySort={vi.fn()}
      />,
    );
    const item = screen.getByTestId("sort-item-type");
    fireEvent.keyDown(item, { key: "ArrowDown", code: "ArrowDown" });
    expect(handleSort).not.toHaveBeenCalled();
  });

  it("clears the secondary sort chip with Enter on the close button", () => {
    const handleClear = vi.fn();
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={handleClear}
      />,
    );
    const closeBtn = screen.getByLabelText(/clear secondary sort/i);
    fireEvent.keyDown(closeBtn, { key: "Enter", code: "Enter" });
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("clears the secondary sort chip with Space on the close button", () => {
    const handleClear = vi.fn();
    render(
      <SortControl
        sortConfigs={multiSortConfigs}
        onSort={vi.fn()}
        onClearSecondarySort={handleClear}
      />,
    );
    const closeBtn = screen.getByLabelText(/clear secondary sort/i);
    const preventDefault = vi.fn();
    fireEvent.keyDown(closeBtn, {
      key: " ",
      code: "Space",
      preventDefault,
    } as unknown as React.KeyboardEvent);
    expect(preventDefault).toHaveBeenCalled();
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});

describe("SortControl — menu-item ARIA state", () => {
  it("marks the primary sort item as aria-checked=true", () => {
    render(
      <SortControl
        sortConfigs={[{ field: "date", direction: "desc" }]}
        onSort={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sort-item-date")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByTestId("sort-item-amount")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("marks the secondary sort item as aria-checked=mixed", () => {
    render(
      <SortControl
        sortConfigs={[
          { field: "status", direction: "asc" },
          { field: "amount", direction: "desc" },
        ]}
        onSort={vi.fn()}
      />,
    );
    expect(screen.getByTestId("sort-item-status")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByTestId("sort-item-amount")).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });

  it("uses role=menuitemcheckbox on each sort item", () => {
    render(
      <SortControl sortConfigs={[]} onSort={vi.fn()} />,
    );
    for (const field of ["date", "amount", "type", "status"]) {
      expect(screen.getByTestId(`sort-item-${field}`)).toHaveAttribute(
        "role",
        "menuitemcheckbox",
      );
    }
  });
});
