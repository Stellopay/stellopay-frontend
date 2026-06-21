import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TableSearchbar from "./table-searchbar";

describe("TableSearchbar", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("labels the transaction search input for assistive technology", () => {
    render(<TableSearchbar onSearch={vi.fn()} />);

    expect(
      screen.getByRole("textbox", { name: "Search transactions" }),
    ).toBeInTheDocument();
  });

  it("debounces search changes before notifying the parent", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    render(<TableSearchbar onSearch={onSearch} />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Search transactions" }),
      {
        target: { value: "ste" },
      },
    );

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSearch).toHaveBeenCalledWith("ste");
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("only emits the latest value when typing continues within the debounce window", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    render(<TableSearchbar onSearch={onSearch} />);
    const input = screen.getByRole("textbox", { name: "Search transactions" });

    fireEvent.change(input, { target: { value: "s" } });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    fireEvent.change(input, { target: { value: "stellar" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("stellar");
  });

  it("clears the pending debounce timer on unmount", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();

    const { unmount } = render(<TableSearchbar onSearch={onSearch} />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Search transactions" }),
      {
        target: { value: "cancelled" },
      },
    );
    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onSearch).not.toHaveBeenCalled();
  });
});
