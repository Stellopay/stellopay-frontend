import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TableSearchbar from "@/components/transactions/table-searchbar";

describe("TableSearchbar", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("debounces search changes and labels the search field", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    render(<TableSearchbar onSearch={onSearch} debounceMs={250} />);

    const input = screen.getByRole("searchbox", {
      name: /search transactions/i,
    });
    expect(input).toHaveAttribute("type", "search");

    fireEvent.change(input, { target: { value: "s" } });
    fireEvent.change(input, { target: { value: "st" } });
    fireEvent.change(input, { target: { value: "stellar" } });

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(249);
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenLastCalledWith("stellar");
  });

  it("cancels the pending debounce when unmounted", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    const { unmount } = render(
      <TableSearchbar onSearch={onSearch} debounceMs={250} />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", { name: /search transactions/i }),
      { target: { value: "pending" } },
    );
    unmount();

    vi.advanceTimersByTime(250);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("debounces clearing the search field", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    render(
      <TableSearchbar
        onSearch={onSearch}
        debounceMs={250}
        defaultValue="xlm"
      />,
    );

    const input = screen.getByRole("searchbox", {
      name: /search transactions/i,
    });
    fireEvent.change(input, { target: { value: "" } });

    vi.advanceTimersByTime(250);

    expect(onSearch).toHaveBeenCalledWith("");
  });
});
