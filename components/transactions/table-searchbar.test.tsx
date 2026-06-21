import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TableSearchbar from "./table-searchbar";

describe("TableSearchbar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces search changes and labels the search input", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    render(<TableSearchbar onSearch={onSearch} debounceMs={250} />);

    const input = screen.getByRole("searchbox", {
      name: /search transactions/i,
    });

    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.change(input, { target: { value: "xl" } });
    fireEvent.change(input, { target: { value: "xlm" } });

    vi.advanceTimersByTime(249);
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("xlm");
  });

  it("cancels pending searches on unmount", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    const { unmount } = render(
      <TableSearchbar onSearch={onSearch} debounceMs={250} />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "pending" },
    });

    unmount();
    vi.advanceTimersByTime(250);

    expect(onSearch).not.toHaveBeenCalled();
  });
});
