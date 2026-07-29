import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TableSearchbar from "./table-searchbar";

describe("TableSearchbar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates displayed text immediately on keystrokes without waiting for debounce", () => {
    const onSearch = vi.fn();
    render(<TableSearchbar onSearch={onSearch} debounceMs={300} />);

    const input = screen.getByLabelText("Search transactions") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "S" } });
    expect(input.value).toBe("S");

    fireEvent.change(input, { target: { value: "St" } });
    expect(input.value).toBe("St");

    fireEvent.change(input, { target: { value: "Ste" } });
    expect(input.value).toBe("Ste");

    // onSearch should not have been called yet
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("debounces rapid keystrokes and calls onSearch only once after the debounce window", () => {
    const onSearch = vi.fn();
    render(<TableSearchbar onSearch={onSearch} debounceMs={300} />);

    const input = screen.getByLabelText("Search transactions");

    // Simulate rapid typing: 4 keystrokes in quick succession
    fireEvent.change(input, { target: { value: "s" } });
    fireEvent.change(input, { target: { value: "se" } });
    fireEvent.change(input, { target: { value: "sea" } });
    fireEvent.change(input, { target: { value: "search" } });

    // Before debounce delay, onSearch should NOT be called
    expect(onSearch).not.toHaveBeenCalled();

    // Advance timers by 299ms - still not called
    vi.advanceTimersByTime(299);
    expect(onSearch).not.toHaveBeenCalled();

    // Advance by 1ms to hit 300ms window - called exactly once with final query
    vi.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("search");
  });

  it("resets debounce timer on subsequent keystrokes during active window", () => {
    const onSearch = vi.fn();
    render(<TableSearchbar onSearch={onSearch} debounceMs={300} />);

    const input = screen.getByLabelText("Search transactions");

    fireEvent.change(input, { target: { value: "a" } });
    vi.advanceTimersByTime(200);
    expect(onSearch).not.toHaveBeenCalled();

    // Type another character before 300ms elapses - resets timer
    fireEvent.change(input, { target: { value: "ab" } });
    vi.advanceTimersByTime(200);
    expect(onSearch).not.toHaveBeenCalled();

    // Full 300ms from the second keystroke
    vi.advanceTimersByTime(100);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("ab");
  });

  it("supports custom debounceMs prop", () => {
    const onSearch = vi.fn();
    render(<TableSearchbar onSearch={onSearch} debounceMs={250} />);

    const input = screen.getByLabelText("Search transactions");

    fireEvent.change(input, { target: { value: "test" } });

    vi.advanceTimersByTime(249);
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("test");
  });

  it("renders with initial value prop and updates when controlled value changes", () => {
    const onSearch = vi.fn();
    const { rerender } = render(
      <TableSearchbar value="initial" onSearch={onSearch} debounceMs={300} />
    );

    const input = screen.getByLabelText("Search transactions") as HTMLInputElement;
    expect(input.value).toBe("initial");

    rerender(<TableSearchbar value="updated" onSearch={onSearch} debounceMs={300} />);
    expect(input.value).toBe("updated");
  });

  it("has accessible label and decorative search icon", () => {
    const onSearch = vi.fn();
    render(<TableSearchbar onSearch={onSearch} />);

    expect(screen.getByLabelText("Search transactions")).toBeInTheDocument();

    const icon = screen.getByTestId("table-searchbar-icon");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });
});
