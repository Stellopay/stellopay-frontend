/**
 * Unit tests for SearchBar (debounced search + clear button).
 *
 * Covers:
 *  - onSearch fires debounced, not on every keystroke.
 *  - Rapid typing collapses into a single trailing call.
 *  - Clear button is hidden when empty, shown when non-empty (expanded only).
 *  - Clicking clear resets the input and fires onSearch("") immediately,
 *    bypassing the debounce and canceling any pending debounced call.
 *  - Component renders without an onSearch prop (back-compat for existing consumers).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock the sidebar context ────────────────────────────────────────────────
const sidebarState = { isSidebarOpen: true, isMobile: false };
vi.mock("@/context/sidebar-context", () => ({
  __esModule: true,
  default: () => sidebarState,
}));

import { SearchBar } from "./search-bar";

function getInput(): HTMLInputElement {
  return screen.getByRole("textbox", { name: /search/i });
}

function type(value: string): void {
  fireEvent.change(getInput(), { target: { value } });
}

describe("SearchBar", () => {
  beforeEach(() => {
    sidebarState.isSidebarOpen = true;
    sidebarState.isMobile = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders without an onSearch prop (existing consumers keep working)", () => {
    expect(() => render(<SearchBar />)).not.toThrow();
    expect(getInput()).toHaveValue("");
  });

  it("does not call onSearch immediately on keystroke", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    type("abc");

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("calls onSearch with the query after the default debounce delay", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    type("abc");
    vi.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("abc");
  });

  it("collapses rapid typing into a single trailing call", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    type("h");
    vi.advanceTimersByTime(100);
    type("he");
    vi.advanceTimersByTime(100);
    type("hello");
    vi.advanceTimersByTime(299);
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("hello");
  });

  it("respects a configurable debounceMs prop", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} debounceMs={1000} />);

    type("x");
    vi.advanceTimersByTime(300);
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(700);
    expect(onSearch).toHaveBeenCalledWith("x");
  });

  it("does not render a clear button when the input is empty", () => {
    render(<SearchBar />);
    expect(
      screen.queryByRole("button", { name: /clear search/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a clear button once the input becomes non-empty", () => {
    render(<SearchBar />);

    type("a");

    expect(
      screen.getByRole("button", { name: /clear search/i }),
    ).toBeInTheDocument();
  });

  it("clicking clear resets the input and hides the clear button", () => {
    render(<SearchBar />);

    type("abc");
    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));

    expect(getInput()).toHaveValue("");
    expect(
      screen.queryByRole("button", { name: /clear search/i }),
    ).not.toBeInTheDocument();
  });

  it("clicking clear fires onSearch('') immediately, bypassing the debounce", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    type("abc");
    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));

    expect(onSearch).toHaveBeenCalledWith("");
  });

  it("clicking clear cancels a pending debounced call so it does not fire afterward", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    type("abc");
    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));
    onSearch.mockClear();

    vi.advanceTimersByTime(1000);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("does not render a clear button in the collapsed (icon-only) sidebar state", () => {
    sidebarState.isSidebarOpen = false;
    sidebarState.isMobile = false;
    render(<SearchBar />);

    type("abc");

    expect(
      screen.queryByRole("button", { name: /clear search/i }),
    ).not.toBeInTheDocument();
  });
});
