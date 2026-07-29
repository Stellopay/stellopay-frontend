import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import TransactionsFilters from "./transactions-filters";

// Mock SearchBar to avoid SidebarProvider errors
vi.mock("@/components/common/search-bar", () => ({
  SearchBar: ({ value, onSearch, debounceMs, placeholder }: any) => (
    <div data-testid="mock-search-bar" data-debounce={debounceMs}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  ),
}));

describe("TransactionsFilters", () => {
  const mockOnSearchChange = vi.fn();
  const mockOnFilterChange = vi.fn();
  const mockOnSort = vi.fn();
  const mockOnAdvancedFilterToggle = vi.fn();

  const defaultProps = {
    searchQuery: "",
    selectedFilter: "All Transactions",
    sortConfigs: [],
    onSearchChange: mockOnSearchChange,
    onFilterChange: mockOnFilterChange,
    onSort: mockOnSort,
    onAdvancedFilterToggle: mockOnAdvancedFilterToggle,
    hasAdvancedFilters: false,
    debounceMs: 300,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<TransactionsFilters {...defaultProps} />);
    expect(screen.getByText("All Transactions")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("passes correct props to SearchBar", () => {
    render(<TransactionsFilters {...defaultProps} />);
    
    const searchBar = screen.getByTestId("mock-search-bar");
    expect(searchBar).toHaveAttribute("data-debounce", "300");
  });

  it("calls onSearchChange and onFilterChange when Clear all is clicked", async () => {
    const user = userEvent.setup();
    render(<TransactionsFilters {...defaultProps} searchQuery="test" selectedFilter="Payment Sent" />);
    
    const clearAllButton = screen.getByText("Clear all");
    await user.click(clearAllButton);

    expect(mockOnSearchChange).toHaveBeenCalledWith("");
    expect(mockOnFilterChange).toHaveBeenCalledWith("All Transactions");
  });

  it("displays the correct active filter count badge", () => {
    // 1 for searchQuery, 1 for selectedFilter !== "All Transactions", 1 for hasAdvancedFilters
    render(
      <TransactionsFilters
        {...defaultProps}
        searchQuery="hello"
        selectedFilter="Payment Sent"
        hasAdvancedFilters={true}
      />
    );
    
    // Total count should be 3
    const badge = screen.getByText("3");
    expect(badge).toBeInTheDocument();
  });

  it("does not display badge when no filters are active", () => {
    render(<TransactionsFilters {...defaultProps} />);
    
    // No active filters, so no badge with text "0" should exist
    const badge = screen.queryByText("0");
    expect(badge).not.toBeInTheDocument();
  });
});
