import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionsFilters from "./transactions-filters";
import type { SortConfig, SavedView } from "@/types/transaction";

// ─── Mock Radix UI DropdownMenu ─────────────────────────────────────────
vi.mock("@/components/ui/dropdown-menu", () => {
  // We use a plain div/button wrapper so that the dropdown items always
  // render in the DOM and are accessible to Testing Library queries.
  // Radix portals to document.body, which jsdom cannot handle.
  const MockDropdownMenu = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  );

  const MockDropdownMenuTrigger = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <button data-testid="dropdown-trigger" type="button" {...props}>
      {children}
    </button>
  );

  const MockDropdownMenuContent = ({
    children,
    align,
  }: {
    children: React.ReactNode;
    align?: string;
  }) => <div data-testid="dropdown-content">{children}</div>;

  const MockDropdownMenuItem = ({
    children,
    onClick,
    className,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
  }) => (
    <div
      data-testid="dropdown-item"
      className={className}
      onClick={onClick}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  );

  const MockDropdownMenuSeparator = () => (
    <hr data-testid="dropdown-separator" />
  );

  return {
    DropdownMenu: MockDropdownMenu,
    DropdownMenuTrigger: MockDropdownMenuTrigger,
    DropdownMenuContent: MockDropdownMenuContent,
    DropdownMenuItem: MockDropdownMenuItem,
    DropdownMenuSeparator: MockDropdownMenuSeparator,
  };
});

// ─── Test data ───────────────────────────────────────────────────────────

const defaultSortConfigs: SortConfig[] = [
  { field: "date", direction: "desc" },
];

const defaultProps = {
  searchQuery: "",
  selectedFilter: "All Transactions",
  sortConfigs: defaultSortConfigs,
  onSearchChange: vi.fn(),
  onFilterChange: vi.fn(),
  onSort: vi.fn(),
  onAdvancedFilterToggle: vi.fn(),
  hasAdvancedFilters: false,
} as const;

const mockSavedView: SavedView = {
  id: "sv-1",
  name: "My Payments View",
  filters: {
    searchQuery: "",
    filterQuery: "",
    fromDate: "2026-01-01",
    toDate: "2026-07-29",
    selectedFilter: "Payment Sent",
    sortConfigs: [{ field: "amount", direction: "desc" }],
  },
  createdAt: "2026-07-01T00:00:00.000Z",
};

const mockSavedView2: SavedView = {
  id: "sv-2",
  name: "Recent Activity",
  filters: {
    searchQuery: "test",
    filterQuery: "",
    fromDate: "2026-07-01",
    toDate: "2026-07-29",
    selectedFilter: "All Transactions",
    sortConfigs: [{ field: "date", direction: "asc" }],
  },
  createdAt: "2026-07-15T00:00:00.000Z",
};

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Render TransactionsFilters with defaults overridden by partial props. */
function renderFilters(
  overrides: Partial<Parameters<typeof TransactionsFilters>[0]> = {},
) {
  const props = { ...defaultProps, ...overrides };
  return render(<TransactionsFilters {...props} />);
}

describe("TransactionsFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // ── Basic rendering ──────────────────────────────────────────────────

  it("renders the transaction type filter dropdown", () => {
    renderFilters();
    // The mock renders all dropdown items inline, so "All Transactions" appears
    // in the trigger button and both dropdown menus (type + filter).
    const matches = screen.getAllByText("All Transactions");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the search input", () => {
    renderFilters();
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("renders the Filter dropdown trigger", () => {
    renderFilters();
    const triggers = screen.getAllByTestId("dropdown-trigger");
    const filterTrigger = triggers.find((t) =>
      t.textContent?.includes("Filter"),
    );
    expect(filterTrigger).toBeInTheDocument();
  });

  it("renders the Sort dropdown trigger", () => {
    renderFilters();
    const triggers = screen.getAllByTestId("dropdown-trigger");
    const sortTrigger = triggers.find((t) => t.textContent?.includes("Sort"));
    expect(sortTrigger).toBeInTheDocument();
  });

  it("renders the Advanced filter toggle button", () => {
    renderFilters();
    expect(
      screen.getByLabelText("Open advanced filters"),
    ).toBeInTheDocument();
  });

  // ── Search interactions ──────────────────────────────────────────────

  it("calls onSearchChange when the search input value changes", async () => {
    const onSearch = vi.fn();
    renderFilters({ onSearchChange: onSearch });
    const input = screen.getByPlaceholderText("Search");
    await userEvent.type(input, "foo");
    expect(onSearch).toHaveBeenCalled();
  });

  it("displays the current searchQuery value", () => {
    renderFilters({ searchQuery: "0xABC" });
    const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
    expect(input.value).toBe("0xABC");
  });

  // ── Filter interactions ──────────────────────────────────────────────

  it("calls onFilterChange when 'All Transactions' is selected from the type dropdown", () => {
    const onFilter = vi.fn();
    renderFilters({ onFilterChange: onFilter });
    const items = screen.getAllByTestId("dropdown-item");
    const allTxItem = items.find((item) =>
      item.textContent?.includes("All Transactions"),
    );
    expect(allTxItem).toBeInTheDocument();
    fireEvent.click(allTxItem!);
    expect(onFilter).toHaveBeenCalledWith("All Transactions");
  });

  it("calls onFilterChange when 'Payment Sent' is selected from the type dropdown", () => {
    const onFilter = vi.fn();
    renderFilters({ onFilterChange: onFilter });
    const items = screen.getAllByTestId("dropdown-item");
    const sentItem = items.find((item) =>
      item.textContent?.includes("Payment Sent"),
    );
    expect(sentItem).toBeInTheDocument();
    fireEvent.click(sentItem!);
    expect(onFilter).toHaveBeenCalledWith("Payment Sent");
  });

  // ── Sort interactions ────────────────────────────────────────────────

  it("calls onSort when a sort option is clicked", () => {
    const onSort = vi.fn();
    renderFilters({ onSort });
    const items = screen.getAllByTestId("dropdown-item");
    const dateItem = items.find((item) =>
      item.textContent?.includes("Sort by Date"),
    );
    expect(dateItem).toBeInTheDocument();
    fireEvent.click(dateItem!);
    expect(onSort).toHaveBeenCalledWith("date", { shiftKey: false });
  });

  it("displays sort indicator arrows for active sort fields", () => {
    renderFilters({
      sortConfigs: [{ field: "amount", direction: "asc" }],
    });
    const items = screen.getAllByTestId("dropdown-item");
    const amountItem = items.find((item) =>
      item.textContent?.includes("Sort by Amount"),
    );
    expect(amountItem).toBeInTheDocument();
    expect(amountItem!.textContent).toContain("\u2191");
  });

  // ── Advanced filter toggle ───────────────────────────────────────────

  it("calls onAdvancedFilterToggle when the Advanced button is clicked", () => {
    const onToggle = vi.fn();
    renderFilters({ onAdvancedFilterToggle: onToggle });
    fireEvent.click(screen.getByLabelText("Open advanced filters"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows a green indicator dot when advanced filters are active", () => {
    renderFilters({ hasAdvancedFilters: true });
    const btn = screen.getByLabelText("Open advanced filters");
    expect(btn.className).toContain("text-[#34D399]");
  });

  it("does not render the Advanced button when onAdvancedFilterToggle is undefined", () => {
    renderFilters({ onAdvancedFilterToggle: undefined });
    expect(
      screen.queryByLabelText("Open advanced filters"),
    ).not.toBeInTheDocument();
  });

  // ── Save View button ─────────────────────────────────────────────────

  it("renders the Save view button when onSaveView is provided", () => {
    renderFilters({ onSaveView: vi.fn(), savedViews: [] });
    expect(screen.getByLabelText("Save current view")).toBeInTheDocument();
  });

  it("does NOT render the Save view button when onSaveView is not provided", () => {
    renderFilters({ onSaveView: undefined, savedViews: [] });
    expect(
      screen.queryByLabelText("Save current view"),
    ).not.toBeInTheDocument();
  });

  it("does NOT render the Save view button when max saved views is reached", () => {
    const manyViews = Array.from({ length: 10 }, (_, i) => ({
      ...mockSavedView,
      id: `sv-${i}`,
      name: `View ${i}`,
    }));
    renderFilters({ onSaveView: vi.fn(), savedViews: manyViews });
    expect(
      screen.queryByLabelText("Save current view"),
    ).not.toBeInTheDocument();
  });

  it("calls onSaveView with the entered name when the user confirms the prompt", () => {
    const onSave = vi.fn();
    // Mock window.prompt to return a name
    const promptSpy = vi
      .spyOn(window, "prompt")
      .mockReturnValueOnce("My Filter Combo");
    renderFilters({ onSaveView: onSave, savedViews: [] });
    fireEvent.click(screen.getByLabelText("Save current view"));
    expect(promptSpy).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("My Filter Combo");
    promptSpy.mockRestore();
  });

  it("trims whitespace from the saved view name", () => {
    const onSave = vi.fn();
    vi.spyOn(window, "prompt").mockReturnValueOnce("  Trimmed Name  ");
    renderFilters({ onSaveView: onSave, savedViews: [] });
    fireEvent.click(screen.getByLabelText("Save current view"));
    expect(onSave).toHaveBeenCalledWith("Trimmed Name");
  });

  it("does NOT call onSaveView when the user cancels the prompt", () => {
    const onSave = vi.fn();
    vi.spyOn(window, "prompt").mockReturnValueOnce(null);
    renderFilters({ onSaveView: onSave, savedViews: [] });
    fireEvent.click(screen.getByLabelText("Save current view"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("truncates the name to MAX_VIEW_NAME_LENGTH", () => {
    const onSave = vi.fn();
    const longName = "A".repeat(100);
    vi.spyOn(window, "prompt").mockReturnValueOnce(longName);
    renderFilters({ onSaveView: onSave, savedViews: [] });
    fireEvent.click(screen.getByLabelText("Save current view"));
    expect(onSave).toHaveBeenCalledWith("A".repeat(50));
  });

  // ── Saved Views dropdown ─────────────────────────────────────────────

  it("renders the Saved Views dropdown when there are saved views", () => {
    renderFilters({
      onLoadView: vi.fn(),
      savedViews: [mockSavedView],
    });
    expect(screen.getByLabelText("Saved views")).toBeInTheDocument();
  });

  it("does NOT render the Saved Views dropdown when there are no saved views", () => {
    renderFilters({
      onLoadView: vi.fn(),
      savedViews: [],
    });
    expect(screen.queryByLabelText("Saved views")).not.toBeInTheDocument();
  });

  it("shows the count of saved views", () => {
    renderFilters({
      onLoadView: vi.fn(),
      savedViews: [mockSavedView, mockSavedView2],
    });
    const trigger = screen.getByLabelText("Saved views");
    expect(trigger.textContent).toContain("2");
  });

  it("displays saved view names in the dropdown", () => {
    renderFilters({
      onLoadView: vi.fn(),
      savedViews: [mockSavedView, mockSavedView2],
    });
    expect(screen.getByText("My Payments View")).toBeInTheDocument();
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("calls onLoadView when a saved view is clicked", () => {
    const onLoad = vi.fn();
    renderFilters({
      onLoadView: onLoad,
      savedViews: [mockSavedView],
    });
    fireEvent.click(
      screen.getByLabelText("Load saved view: My Payments View"),
    );
    expect(onLoad).toHaveBeenCalledWith(mockSavedView);
  });

  // ── Rename saved view ────────────────────────────────────────────────

  it("enters rename mode when the pencil button is clicked", () => {
    const onRename = vi.fn();
    renderFilters({
      onLoadView: vi.fn(),
      onRenameView: onRename,
      savedViews: [mockSavedView],
    });
    fireEvent.click(
      screen.getByLabelText("Rename saved view: My Payments View"),
    );
    // An inline input should appear
    const input = screen.getByLabelText("Rename saved view");
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("My Payments View");
  });

  it("commits the rename on Enter key", () => {
    const onRename = vi.fn();
    renderFilters({
      onLoadView: vi.fn(),
      onRenameView: onRename,
      savedViews: [mockSavedView],
    });
    fireEvent.click(
      screen.getByLabelText("Rename saved view: My Payments View"),
    );
    const input = screen.getByLabelText("Rename saved view");
    fireEvent.change(input, { target: { value: "Updated Name" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRename).toHaveBeenCalledWith(mockSavedView, "Updated Name");
  });

  it("commits the rename on blur", () => {
    const onRename = vi.fn();
    renderFilters({
      onLoadView: vi.fn(),
      onRenameView: onRename,
      savedViews: [mockSavedView],
    });
    fireEvent.click(
      screen.getByLabelText("Rename saved view: My Payments View"),
    );
    const input = screen.getByLabelText("Rename saved view");
    fireEvent.change(input, { target: { value: "Blur Updated" } });
    fireEvent.blur(input);
    expect(onRename).toHaveBeenCalledWith(mockSavedView, "Blur Updated");
  });

  it("cancels the rename on Escape key", () => {
    const onRename = vi.fn();
    renderFilters({
      onLoadView: vi.fn(),
      onRenameView: onRename,
      savedViews: [mockSavedView],
    });
    fireEvent.click(
      screen.getByLabelText("Rename saved view: My Payments View"),
    );
    const input = screen.getByLabelText("Rename saved view");
    fireEvent.change(input, { target: { value: "Should Not Save" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onRename).not.toHaveBeenCalled();
    // The original name should be visible again
    expect(
      screen.getByLabelText("Load saved view: My Payments View"),
    ).toBeInTheDocument();
  });

  it("does not render rename button when onRenameView is not provided", () => {
    renderFilters({
      onLoadView: vi.fn(),
      onRenameView: undefined,
      savedViews: [mockSavedView],
    });
    expect(
      screen.queryByLabelText("Rename saved view: My Payments View"),
    ).not.toBeInTheDocument();
  });

  // ── Delete saved view ────────────────────────────────────────────────

  it("calls onDeleteView after user confirms the deletion dialog", () => {
    const onDelete = vi.fn();
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(true);
    renderFilters({
      onLoadView: vi.fn(),
      onDeleteView: onDelete,
      savedViews: [mockSavedView],
    });
    fireEvent.click(
      screen.getByLabelText("Delete saved view: My Payments View"),
    );
    expect(onDelete).toHaveBeenCalledWith(mockSavedView);
    confirmSpy.mockRestore();
  });

  it("does NOT call onDeleteView when the user cancels the confirmation dialog", () => {
    const onDelete = vi.fn();
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false);
    renderFilters({
      onLoadView: vi.fn(),
      onDeleteView: onDelete,
      savedViews: [mockSavedView],
    });
    fireEvent.click(
      screen.getByLabelText("Delete saved view: My Payments View"),
    );
    expect(onDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("does not render delete button when onDeleteView is not provided", () => {
    renderFilters({
      onLoadView: vi.fn(),
      onDeleteView: undefined,
      savedViews: [mockSavedView],
    });
    expect(
      screen.queryByLabelText("Delete saved view: My Payments View"),
    ).not.toBeInTheDocument();
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  it("handles an empty savedViews array gracefully", () => {
    renderFilters({
      onSaveView: vi.fn(),
      onLoadView: vi.fn(),
      savedViews: [],
    });
    // Save button should appear (can still save)
    expect(screen.getByLabelText("Save current view")).toBeInTheDocument();
    // No views dropdown
    expect(screen.queryByLabelText("Saved views")).not.toBeInTheDocument();
  });

  it("handles an undefined savedViews gracefully", () => {
    renderFilters({
      onLoadView: vi.fn(),
      savedViews: undefined,
    });
    // No saved views UI should be visible
    expect(screen.queryByLabelText("Saved views")).not.toBeInTheDocument();
  });

  it("renders correctly with all callback props undefined (minimal mode)", () => {
    renderFilters({
      onAdvancedFilterToggle: undefined,
      onSaveView: undefined,
      onLoadView: undefined,
      onRenameView: undefined,
      onDeleteView: undefined,
    });
    // Core UI should still render
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    // "All Transactions" appears in the type filter trigger and both dropdown menus.
    expect(screen.getAllByText("All Transactions").length).toBeGreaterThanOrEqual(1);
    // But optional buttons should not
    expect(
      screen.queryByLabelText("Open advanced filters"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Save current view"),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Saved views")).not.toBeInTheDocument();
  });

  // ── Accessibility ────────────────────────────────────────────────────

  it("has accessible aria-labels on all interactive buttons", () => {
    renderFilters({
      onSaveView: vi.fn(),
      onLoadView: vi.fn(),
      onRenameView: vi.fn(),
      onDeleteView: vi.fn(),
      savedViews: [mockSavedView],
    });
    expect(screen.getByLabelText("Open advanced filters")).toBeInTheDocument();
    expect(screen.getByLabelText("Save current view")).toBeInTheDocument();
    expect(screen.getByLabelText("Saved views")).toBeInTheDocument();
  });

  it("uses role='group' and aria-label on each saved view item", () => {
    renderFilters({
      onLoadView: vi.fn(),
      onRenameView: vi.fn(),
      onDeleteView: vi.fn(),
      savedViews: [mockSavedView],
    });
    const group = screen.getByRole("group", {
      name: "Saved view: My Payments View",
    });
    expect(group).toBeInTheDocument();
  });

  it("renders visible focus indicators on rename input", () => {
    renderFilters({
      onLoadView: vi.fn(),
      onRenameView: vi.fn(),
      savedViews: [mockSavedView],
    });
    fireEvent.click(
      screen.getByLabelText("Rename saved view: My Payments View"),
    );
    const input = screen.getByLabelText("Rename saved view");
    expect(input.className).toContain("focus-visible:ring-2");
  });
});
